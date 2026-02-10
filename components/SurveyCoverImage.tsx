
import React from 'react';

interface SurveyCoverImageProps {
  src: string;
}

const SurveyCoverImage: React.FC<SurveyCoverImageProps> = ({ src }) => {
  return (
    <div className="w-full h-48 md:h-64 lg:h-72 rounded-xl overflow-hidden shadow-lg relative">
      <img src={src} alt="Survey Cover" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20"></div>
    </div>
  );
};

export default SurveyCoverImage;
