<?php
// Dynamické CORS povolení pro více domén
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Přidej další domény pro produkci
    ];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$targetDir = __DIR__ . '/../assets/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Získat aktuální cestu z parametru (relativní k assets/)
$currentPath = isset($_GET['path']) ? $_GET['path'] : '';
$currentPath = trim($currentPath, '/');

// Bezpečnostní kontrola - zabránit directory traversal
$currentPath = str_replace(['..', '\\'], ['', '/'], $currentPath);

$fullPath = $targetDir . ($currentPath ? $currentPath . '/' : '');

if (!is_dir($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Složka neexistuje']);
    exit;
}

$folders = [];
$files = [];
$items = scandir($fullPath);

foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;
    
    // Přeskočit thumbnaily (začínají na _thumb_)
    if (strpos($item, '_thumb_') === 0) {
        continue;
    }
    
    $itemPath = $fullPath . $item;
    $relativePath = $currentPath ? $currentPath . '/' . $item : $item;
    
    if (is_dir($itemPath)) {
        $folders[] = [
            'name' => $item,
            'path' => $relativePath,
            'type' => 'folder'
        ];
    } elseif (is_file($itemPath)) {
        $mimeType = mime_content_type($itemPath);
        $thumbnailPath = null;
        
        // Zkontrolovat, zda existuje náhled vedle souboru
        if (strpos($mimeType, 'image/') === 0) {
            $thumbnailFile = dirname($itemPath) . '/_thumb_' . $item;
            if (file_exists($thumbnailFile)) {
                $thumbnailRelativePath = $currentPath ? $currentPath . '/_thumb_' . $item : '_thumb_' . $item;
                $thumbnailPath = '/assets/' . $thumbnailRelativePath;
            }
        }
        
        $files[] = [
            'name' => $item,
            'path' => '/assets/' . $relativePath,
            'size' => filesize($itemPath),
            'modified' => filemtime($itemPath),
            'type' => $mimeType,
            'thumbnail' => $thumbnailPath
        ];
    }
}

// Seřadit složky podle názvu
usort($folders, function($a, $b) {
    return strcmp($b['name'], $a['name']); // Nejnovější první
});

// Seřadit podle data úpravy (nejnovější první)
usort($files, function($a, $b) {
    return $b['modified'] - $a['modified'];
});

echo json_encode([
    'currentPath' => $currentPath,
    'folders' => $folders,
    'files' => $files
]);
?>
