import notFoundSvg from '@/assets/illustrations/Notfound.svg';

export const ProductNotFoundIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={notFoundSvg} alt="Product Not Found" className="w-[220px] h-[220px] object-contain" />
    </div>
);
