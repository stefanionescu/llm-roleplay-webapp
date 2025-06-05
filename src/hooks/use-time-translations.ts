import { useTranslations } from 'next-intl';

export type TimeTranslations = {
    day: string;
    ago: string;
    hour: string;
    days: string;
    week: string;
    year: string;
    hours: string;
    weeks: string;
    month: string;
    years: string;
    minute: string;
    months: string;
    recent: string;
    justNow: string;
    minutes: string;
    agesAgo: string;
    lastWeek: string;
    lastMonth: string;
    lastThreeMonths: string;
};

export function useTimeTranslations(): TimeTranslations {
    const tUnits = useTranslations('common.timeUnits');
    const tGroups = useTranslations('common.timeGroups');

    return {
        justNow: tUnits('justNow'),
        minute: tUnits('minute'),
        minutes: tUnits('minutes'),
        hour: tUnits('hour'),
        hours: tUnits('hours'),
        day: tUnits('day'),
        days: tUnits('days'),
        week: tUnits('week'),
        weeks: tUnits('weeks'),
        month: tUnits('month'),
        months: tUnits('months'),
        year: tUnits('year'),
        years: tUnits('years'),
        ago: tUnits('ago'),
        recent: tGroups('recent'),
        lastWeek: tGroups('lastWeek'),
        lastMonth: tGroups('lastMonth'),
        lastThreeMonths: tGroups('lastThreeMonths'),
        agesAgo: tGroups('agesAgo'),
    };
}
