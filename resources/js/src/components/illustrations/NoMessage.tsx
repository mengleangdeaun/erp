import noMessageSvg from '@/assets/illustrations/NoMessage.svg';

export const NoMessageIllustration = () => (
    <div className="flex flex-col items-center justify-center py-4">
        <img src={noMessageSvg} alt="No Message" className="w-[120px] h-[120px] object-contain" />
    </div>
);
