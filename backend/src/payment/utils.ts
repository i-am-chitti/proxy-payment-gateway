import * as fs from 'fs';
import * as https from 'https';

// Function to download the file and save it
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302) {
        const newUrl = response.headers.location;

        const file = fs.createWriteStream(dest);
        https
          .get(newUrl, (response) => {
            if (response.statusCode !== 200) {
              fs.unlink(dest, () => reject(new Error(`Failed to get ${url}`)));
            }
            response.pipe(file);
            file.on('finish', () => {
              file.close(resolve);
            });
          })
          .on('error', (err) => {
            fs.unlink(dest, () => reject(err));
          });
      }
    });
  });
};

export { downloadFile };
