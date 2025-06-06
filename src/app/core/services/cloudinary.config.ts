import { Cloudinary } from '@cloudinary/url-gen';

export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'rouhi',
  },
  url: {
    secure: true,
  },
});