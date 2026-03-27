import emptyDataSvg from '@/assets/illustrations/NoData.svg';
import emptyDataSmallSvg from '@/assets/illustrations/NoDataSmall.svg';

export const EmptyDataIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={emptyDataSvg} alt="Empty Data" className="w-[120px] h-[120px] object-contain" />
    </div>
);

export const EmptyDataSmallIllustration = () => (
    <div className="flex flex-col items-center justify-center py-2">
        <img src={emptyDataSmallSvg} alt="Empty Data" className="w-[80px] h-[80px] object-contain" />
    </div>
);