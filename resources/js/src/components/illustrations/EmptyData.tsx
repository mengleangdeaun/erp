import emptyDataSvg from '@/assets/illustrations/NoData.svg';

export const EmptyDataIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={emptyDataSvg} alt="Empty Data" className="w-[120px] h-[120px] object-contain" />
    </div>
);
