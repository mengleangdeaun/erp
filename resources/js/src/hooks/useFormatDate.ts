import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import dayjs from 'dayjs';

export const useFormatDate = () => {
    const { dateFormat, timeFormat } = useSelector((state: IRootState) => state.themeConfig);

    const formatTime = (date: string | Date | dayjs.Dayjs | null | undefined) => {
        if (!date) return '—';
        const formatString = timeFormat === '24h' ? 'HH:mm' : 'h:mm A';
        return dayjs(date).format(formatString);
    };

    const formatDate = (date: string | Date | dayjs.Dayjs | null | undefined) => {
        if (!date) return '—';
        return dayjs(date).format(dateFormat);
    };

    const formatDateTime = (date: string | Date | dayjs.Dayjs | null | undefined) => {
        if (!date) return '—';
        const timeFormatString = timeFormat === '24h' ? 'HH:mm' : 'h:mm A';
        return dayjs(date).format(`${dateFormat} ${timeFormatString}`);
    };

    return {
        formatDate,
        formatTime,
        formatDateTime,
        dateFormat,
        timeFormat,
    };
};
