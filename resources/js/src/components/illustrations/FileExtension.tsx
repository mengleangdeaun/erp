import JPGSvg from '@/assets/illustrations/JPG.svg';
import PDFSvg from '@/assets/illustrations/PDF.svg';
import CSVSvg from '@/assets/illustrations/CSV.svg';
import PNGSvg from '@/assets/illustrations/PNG.svg';

export const JPGFile = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={JPGSvg} alt="JPG" className="w-[120px] h-[120px] object-contain" />
    </div>
);

export const PDFFile = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={PDFSvg} alt="PDF" className="w-[120px] h-[120px] object-contain" />
    </div>
);

export const CSVFile = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={CSVSvg} alt="CSV" className="w-[120px] h-[120px] object-contain" />
    </div>
);

export const PNGFile = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={PNGSvg} alt="PNG" className="w-[120px] h-[120px] object-contain" />
    </div>
);
