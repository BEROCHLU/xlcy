<?php
// リクエストURIとメソッドを取得
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

if (preg_match('#/static/uploads$#', $requestPath) && $requestMethod === 'GET') {
    // xlsxリスト要求の場合、Content-TypeをJSONに設定
    header('Content-Type: application/json');
    // xlsxファイルが格納されているディレクトリ (絶対パス解決)
    $directory = __DIR__ . '/static/uploads';
    
    if (!is_dir($directory)) {
        echo json_encode(['files' => []]);
        exit;
    }
    
    // ディレクトリからファイル一覧を取得
    $files = scandir($directory);
    if ($files === false) {
        echo json_encode(['files' => []]);
        exit;
    }
    
    // '.' と '..' を除去
    $files = array_diff($files, array('.', '..'));
    // .xlsxまたは.xlsmファイルのみをフィルタリング
    $xlsxFiles = array_filter($files, function ($file) {
        return preg_match('/\.(xlsx|xlsm)$/', $file);
    });
    
    // 各ファイル名がUTF-8として有効か検証
    foreach ($xlsxFiles as $file) {
        if (!mb_check_encoding($file, 'UTF-8')) {
            http_response_code(500);
            $readableName = mb_convert_encoding($file, 'UTF-8', 'SJIS-win, UTF-8');
            echo json_encode([
                'error' => "Invalid filename encoding detected. File names must be UTF-8. (Detected file: {$readableName})"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    // JSON形式でファイル一覧を返す
    $json = json_encode(['files' => array_values($xlsxFiles)]);
    if ($json === false) {
        http_response_code(500);
        echo json_encode([
            'error' => 'JSON encoding failed: ' . json_last_error_msg()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo $json;
    exit;
} elseif (preg_match('#/static$#', $requestPath) && $requestMethod === 'POST') {
    // 静的ファイルの保存要求の場合、Content-Typeをプレーンテキストに設定
    header('Content-Type: text/plain');
    
    if (!isset($_POST['json']) || !isset($_POST['filename'])) {
        http_response_code(400);
        echo "Missing required parameters (json, filename).";
        exit;
    }
    
    // POSTデータからJSONデータとファイル名を取得
    $jsonData = $_POST['json'];
    // ファイル名に含まれる不正な文字を削除
    $fileName = basename($_POST['filename']);
    // 保存先ディレクトリ
    $saveDir = __DIR__ . '/static/uploads/';
    
    if (!is_dir($saveDir)) {
        mkdir($saveDir, 0755, true);
    }
    
    // 完全なファイルパス
    $filePath = $saveDir . $fileName;
    // JSONデータをファイルに書き込み
    if (file_put_contents($filePath, $jsonData)) {
        echo "JSON data received and saved! {$fileName}";
    } else {
        http_response_code(500);
        echo "Failed to save JSON data.";
    }
    exit;
} else {
    // リクエストが index.php, index.html またはスラッシュで終わる場合、メインページを返す
    if (preg_match('#/(index\.php|index\.html|)?$#', $requestPath)) {
        include __DIR__ . "/index.html";
        exit;
    } else {
        // 上記のどの条件にも当てはまらない場合、404エラーを返す
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Not Found']);
        exit;
    }
}
