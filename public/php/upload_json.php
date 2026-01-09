<?php
// php/upload_json.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$targetDir = __DIR__ . '/../data/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['jsonfile'])) {
    $file = $_FILES['jsonfile'];
    $targetFile = $targetDir . basename($file['name']);

    if (pathinfo($targetFile, PATHINFO_EXTENSION) !== 'json') {
        http_response_code(400);
        echo "Pouze JSON soubory jsou povoleny.";
        exit;
    }

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        echo "Soubor byl úspěšně nahrán.";
    } else {
        http_response_code(500);
        echo "Chyba při nahrávání souboru.";
    }
} else {
    http_response_code(400);
    echo "Nahrávání selhalo.";
}
?>
