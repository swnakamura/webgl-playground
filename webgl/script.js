onload = function() {
  // canvasエレメントを取得
  var c = document.getElementById("canvas");
  c.width = 500;
  c.height = 300;

  // webglコンテキストを取得
  var gl = c.getContext("webgl") || c.getContext("experimental-webgl");


  // 深度テストを有効化
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  //カリングを有効化
  gl.enable(gl.CULL_FACE);
  // gl.frontFace(gl.CW);


  // 頂点シェーダとフラグメントシェーダの生成
  var v_shader = create_shader("vs");
  var f_shader = create_shader("fs");

  // プログラムオブジェクトの生成とリンク
  var prg = create_program(v_shader, f_shader);

  var attLocation = new Array(2);
  attLocation[0] = gl.getAttribLocation(prg, "position");
  attLocation[1] = gl.getAttribLocation(prg, "color");
  var attStride = new Array(2);
  attStride[0] = 3;
  attStride[1] = 4;

  // モデル(頂点)データ
  var torusData = torus(32,32,1,2);

  vertex_position = torusData[0];
  vertex_color = torusData[1];
  index = torusData[2];

  // VBOの生成
  var pos_vbo = create_vbo(vertex_position);
  var col_vbo = create_vbo(vertex_color);

  // VBOをバインドし登録する
  set_attribute([pos_vbo,col_vbo], attLocation, attStride);

  // IBOの生成
  var ibo = create_ibo(index);

  // IBOをバインドして登録する
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

  // uniformLocationの取得
  var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

  // minMatrix.js を用いた行列関連処理
  // matIVオブジェクトを生成
  var m = new matIV();

  // 各種行列の生成と初期化
  var mMatrix = m.identity(m.create());
  var vMatrix = m.identity(m.create());
  var pMatrix = m.identity(m.create());
  var tmpMatrix = m.identity(m.create());
  var mvpMatrix = m.identity(m.create());

  // ビュー座標変換行列
  m.lookAt([0.0, 3.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);

  // プロジェクション座標変換行列
  m.perspective(90, c.width / c.height, 0.1, 100.0, pMatrix);

  // これら2つの積
  m.multiply(pMatrix, vMatrix, tmpMatrix);

  //1つ目のモデルを移動させるためのモデル座標変換行列
  m.translate(mMatrix, [1.5,0.0,0.0], mMatrix);

  //mvp of the 1st
  m.multiply(tmpMatrix, mMatrix, mvpMatrix);

  // カウンタの宣言
  var count = 0;

  //恒常ループ
  (function(){
    //canvasを初期化
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //カウンタをインクリメント
    count++;

    //カウンタを元にラジアンを算出
    var rad = (count % 360) * Math.PI / 180;

    // モデル座標変換行列の生成
    m.identity(mMatrix);
    m.rotate(mMatrix, rad, [0,1,0], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

    //インデックスを用いた描画命令
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    setTimeout(arguments.callee,1000/30);
  })();

  // 以下，上で使用した関数の定義
  // シェーダを生成する関数
  function create_shader(id) {
    // シェーダを格納する変数
    var shader;

    // HTMLからscriptタグへの参照を取得
    var scriptElement = document.getElementById(id);

    // scriptタグが存在しない場合は抜ける
    if (!scriptElement) {
      return;
    }

    // scriptタグのtype属性をチェック
    switch (scriptElement.type) {
        // 頂点シェーダの場合
      case "x-shader/x-vertex":
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;

        // フラグメントシェーダの場合
      case "x-shader/x-fragment":
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      default:
        return;
    }

    // 生成されたシェーダにソースを割り当てる
    gl.shaderSource(shader, scriptElement.text);

    // シェーダをコンパイルする
    gl.compileShader(shader);

    // シェーダが正しくコンパイルされたかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // 成功していたらシェーダを返して終了
      return shader;
    } else {
      // 失敗していたらエラーログをアラートする
      alert(gl.getShaderInfoLog(shader));
    }
  }

  // プログラムオブジェクトを生成しシェーダをリンクする関数
  function create_program(vs, fs) {
    // プログラムオブジェクトの生成
    var program = gl.createProgram();

    // プログラムオブジェクトにシェーダを割り当てる
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    // シェーダをリンク
    gl.linkProgram(program);

    // シェーダのリンクが正しく行なわれたかチェック
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // 成功していたらプログラムオブジェクトを有効にする
      gl.useProgram(program);

      // プログラムオブジェクトを返して終了
      return program;
    } else {
      // 失敗していたらエラーログをアラートする
      alert(gl.getProgramInfoLog(program));
    }
  }

  // VBOを生成する関数
  function create_vbo(data) {
    // バッファオブジェクトの生成
    var vbo = gl.createBuffer();

    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    // バッファのバインドを無効化
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // 生成した VBO を返して終了
    return vbo;
  }

  function create_ibo(data) {
    // バッファオブジェクトの生成
    var ibo = gl.createBuffer();

    // バッファをバインドする
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    // バッファにデータをセット
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

    // バッファのバインドを無効化
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // 生成したIBOを返して終了
    return ibo;
  }

  function set_attribute(vbos,attL,attS) {
    for(var i in vbos){
      gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
      gl.enableVertexAttribArray(attL[i]);
      gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
    }
  }

  function torus(row, column, irad, orad){
    var pos = new Array(), col = new Array(), idx = new Array();
    for(var i = 0; i <= row; i++){
      var r = Math.PI * 2 / row * i;
      var rr = Math.cos(r);
      var ry = Math.sin(r);
      for(var ii = 0; ii <= column; ii++){
        var tr = Math.PI * 2 / column * ii;
        var tx = (rr * irad + orad) * Math.cos(tr);
        var ty = ry * irad;
        var tz = (rr * irad + orad) * Math.sin(tr);
        pos.push(tx, ty, tz);
        var tc = hsva(360 / column * ii, 1, 1, 1);
        col.push(tc[0], tc[1], tc[2], tc[3]);
      }
    }
    for(i = 0; i < row; i++){
      for(ii = 0; ii < column; ii++){
        r = (column + 1) * i + ii;
        idx.push(r, r + column + 1, r + 1);
        idx.push(r + column + 1, r + column + 2, r + 1);
      }
    }
    return [pos, col, idx];
  }

  function hsva(h, s, v, a){
    if(s > 1 || v > 1 || a > 1){return;}
    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();
    if(!s > 0 && !s < 0){
      color.push(v, v, v, a); 
    } else {
      var r = new Array(v, n, m, m, k, v);
      var g = new Array(k, v, v, n, m, m);
      var b = new Array(m, m, k, v, v, n);
      color.push(r[i], g[i], b[i], a);
    }
    return color;
  }
};
