import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN =
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const initMixpanel = () => {
    if (!MIXPANEL_TOKEN) {
        return;
    }

    mixpanel.init(MIXPANEL_TOKEN, {
        autocapture: {
            pageview: 'full-url',
            click: true, // click tracking enabled
            input: true,
            scroll: true,
            submit: true,
            capture_text_content: true,
        },
        record_sessions_percent: 100,
        record_idle_timeout_ms: 300000, // 5 minutes
        record_block_class: '',
        record_block_selector: '',
        record_mask_text_class: '',
        record_mask_text_selector: '',
        record_max_ms: 600000,
        record_canvas: false,
        record_collect_fonts: true,
    });
};
