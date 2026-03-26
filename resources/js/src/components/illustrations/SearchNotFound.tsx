import notFoundSvg from '@/assets/illustrations/Notfound.svg';

export const SearchNotFoundIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={notFoundSvg} alt="Search Not Found" className="w-[220px] h-[220px] object-contain" />
    </div>
);

