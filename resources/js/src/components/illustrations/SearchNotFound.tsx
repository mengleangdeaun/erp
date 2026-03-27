import notFoundSvg from '@/assets/illustrations/Notfound.svg';
import noAccountSvg from '@/assets/illustrations/NoAccount.svg';

export const SearchNotFoundIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={notFoundSvg} alt="Search Not Found" className="w-[220px] h-[220px] object-contain" />
    </div>
);

export const NoAccountIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={noAccountSvg} alt="No Account" className="w-[220px] h-[220px] object-contain" />
    </div>
);

