export const extractDominantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('#5865F2'); // Fallback to Discord blurple
          return;
        }
        
        // Set canvas size to a smaller size for performance
        canvas.width = 50;
        canvas.height = 50;
        
        // Draw the image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate dominant color
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          // Skip transparent pixels
          if (data[i + 3] > 128) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          
          // Convert to hex
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          resolve(hex);
        } else {
          resolve('#5865F2'); // Fallback to Discord blurple
        }
      } catch (error) {
        resolve('#5865F2'); // Fallback to Discord blurple
      }
    };
    
    img.onerror = () => {
      resolve('#5865F2'); // Fallback to Discord blurple
    };
    
    img.src = imageUrl;
  });
};
