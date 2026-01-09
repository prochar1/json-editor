<?php
// Funkce pro vytvoření náhledu (extrahována pro použití v ostatních scriptech)
function createThumbnail($sourcePath, $thumbnailPath, $maxWidth = 200, $maxHeight = 200) {
    $imageInfo = @getimagesize($sourcePath);
    if (!$imageInfo) return false;
    
    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $mimeType = $imageInfo['mime'];
    
    // Načíst obrázek podle typu
    switch ($mimeType) {
        case 'image/jpeg':
            $sourceImage = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = @imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            $sourceImage = @imagecreatefromgif($sourcePath);
            break;
        case 'image/webp':
            $sourceImage = @imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }
    
    if (!$sourceImage) return false;
    
    // Vypočítat nové rozměry se zachováním poměru stran
    $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
    $newWidth = (int)($sourceWidth * $ratio);
    $newHeight = (int)($sourceHeight * $ratio);
    
    // Vytvořit náhled
    $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
    
    // Zachovat průhlednost pro PNG a GIF
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
        imagefill($thumbnail, 0, 0, $transparent);
    }
    
    imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $sourceWidth, $sourceHeight);
    
    // Uložit náhled jako JPEG (nebo PNG pro průhlednost)
    $thumbnailDir = dirname($thumbnailPath);
    if (!is_dir($thumbnailDir)) {
        mkdir($thumbnailDir, 0777, true);
    }
    
    if ($mimeType === 'image/png') {
        imagepng($thumbnail, $thumbnailPath, 8);
    } else {
        imagejpeg($thumbnail, $thumbnailPath, 85);
    }
    
    imagedestroy($sourceImage);
    imagedestroy($thumbnail);
    
    return true;
}
?>
