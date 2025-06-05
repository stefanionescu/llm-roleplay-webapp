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
    justNow: string;
    minutes: string;
};

export type TimeGroup =
    | 'recent'
    | 'lastThreeDays'
    | 'lastWeek'
    | 'lastMonth'
    | 'lastThreeMonths'
    | 'agesAgo';

export function getTimeGroup(
    date: Date | null,
    sessionCount: number,
): TimeGroup {
    if (!date || sessionCount === 0) return 'recent';

    const now = new Date();
    const diffInHours =
        (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours <= 24) return 'recent';
    if (diffInDays <= 3) return 'lastThreeDays';
    if (diffInDays <= 7) return 'lastWeek';
    if (diffInDays <= 30) return 'lastMonth';
    if (diffInDays <= 90) return 'lastThreeMonths';
    return 'agesAgo';
}

export function formatRelativeTime(
    date: Date,
    translations?: TimeTranslations,
): string {
    if (!translations) {
        return ''; // Return empty string or some default format if translations are missing
    }

    const now = new Date();
    const seconds = Math.round(
        (now.getTime() - date.getTime()) / 1000,
    );
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30.41); // Average days in month
    const years = Math.round(days / 365.25); // Account for leap years

    const formatWithAgo = (
        number: number,
        unit: string,
        agoText: string,
    ) => {
        // Languages where "ago" comes before the time expression
        const beforeLanguages = ['hace', 'il y a', 'vor'];
        const position = beforeLanguages.includes(agoText)
            ? 'before'
            : 'after';

        if (position === 'before') {
            return `${agoText} ${number} ${unit}`;
        } else {
            return `${number} ${unit} ${agoText}`;
        }
    };

    const agoText = translations.ago || 'ago';

    if (seconds < 60) {
        return translations.justNow || 'just now';
    } else if (minutes < 60) {
        const unit =
            minutes === 1
                ? translations.minute || 'minute'
                : translations.minutes || 'minutes';
        return formatWithAgo(minutes, unit, agoText);
    } else if (hours < 24) {
        const unit =
            hours === 1
                ? translations.hour || 'hour'
                : translations.hours || 'hours';
        return formatWithAgo(hours, unit, agoText);
    } else if (days < 7) {
        const unit =
            days === 1
                ? translations.day || 'day'
                : translations.days || 'days';
        return formatWithAgo(days, unit, agoText);
    } else if (weeks < 4) {
        const unit =
            weeks === 1
                ? translations.week || 'week'
                : translations.weeks || 'weeks';
        return formatWithAgo(weeks, unit, agoText);
    } else if (months < 12) {
        const unit =
            months === 1
                ? translations.month || 'month'
                : translations.months || 'months';
        return formatWithAgo(months, unit, agoText);
    } else {
        const unit =
            years === 1
                ? translations.year || 'year'
                : translations.years || 'years';
        return formatWithAgo(years, unit, agoText);
    }
}
