<script>
import { snackbar } from 'mdui/functions/snackbar.js';

export default {
    data() {
        return {
            currentTime: new Date(),
            timer: null,
            CouponCodes: [
                { code: 'MEGAA', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'UMBRA', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'BEARGGABLE', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'BIGNOSEBUG', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'VICKSY', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'KOUKI', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'VCHIBAN', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'BORZOI', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'AWW', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'FROGGYCROSSING', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'SUPERFREE', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'SQUIDUP', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'NLSS', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                { code: 'LOVE', status: 'Active', isPermanent: true, startMonth: 0, endMonth: 0, isSeasonal: false },
                {
                    code: 'NEWYEAR',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 12,
                    endMonth: 1
                },
                {
                    code: 'DUOSDAY',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 2,
                    endMonth: 2
                },
                {
                    code: 'LUCKY',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 3,
                    endMonth: 3
                },
                {
                    code: 'SAKURA',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 4,
                    endMonth: 4
                },
                {
                    code: 'CANADA',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 7,
                    endMonth: 7
                },
                {
                    code: 'USA',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 7,
                    endMonth: 7
                },
                {
                    code: 'HOWLOWEEN',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 10,
                    endMonth: 10
                },
                {
                    code: 'DAYOFTHEDEAD',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 11,
                    endMonth: 11
                },
                {
                    code: 'BIRTHDAY',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 12,
                    endMonth: 12
                },
                {
                    code: 'CRISPRmas',
                    status: 'Seasonal',
                    isPermanent: false,
                    isSeasonal: true,
                    startMonth: 12,
                    endMonth: 12
                }
            ]
        }
    },
    mounted() {
        this.timer = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    },
    beforeUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
    methods: {
        copyCouponCode(couponCode) {
            navigator.clipboard.writeText(couponCode).then(() => {
                snackbar({
                    message: this.$t('couponCodes.copySuccess') + couponCode,
                });
            }).catch(() => {
                snackbar({
                    message: this.$t('couponCodes.copyFailed') + couponCode,
                });
            });
        },
        isInSeason(coupon) {
            if (!coupon.isSeasonal) return false;
            const currentMonth = this.currentTime.getMonth() + 1;
            if (coupon.startMonth === coupon.endMonth) {
                return currentMonth === coupon.startMonth;
            }
            if (coupon.startMonth > coupon.endMonth) {
                return currentMonth >= coupon.startMonth || currentMonth <= coupon.endMonth;
            }
            return currentMonth >= coupon.startMonth && currentMonth <= coupon.endMonth;
        },
        getSeasonPhase(coupon) {
            if (!coupon.isSeasonal) return null;
            const inSeason = this.isInSeason(coupon);

            if (inSeason) {
                const endDate = this.getSeasonEndDate(coupon);
                const diff = endDate.getTime() - this.currentTime.getTime();
                if (diff > 0) {
                    return { type: 'active', label: this.$t('couponCodes.availableNow'), countdown: this.formatCountdown(diff) };
                }
            }

            const nextStart = this.getNextSeasonStart(coupon);
            if (nextStart) {
                const diff = nextStart.getTime() - this.currentTime.getTime();
                if (diff > 0) {
                    return { type: 'upcoming', label: this.$t('couponCodes.upcoming'), countdown: this.formatCountdown(diff) };
                }
            }

            return { type: 'ended', label: this.$t('couponCodes.seasonEnded'), countdown: '' };
        },
        getNextSeasonStart(coupon) {
            const currentYear = this.currentTime.getFullYear();
            let startYear = currentYear;
            const startDate = new Date(startYear, coupon.startMonth - 1, 1, 0, 0, 0);

            if (this.currentTime.getTime() > startDate.getTime()) {
                if (coupon.startMonth > coupon.endMonth && this.currentTime.getMonth() + 1 <= coupon.endMonth) {
                    return startDate;
                }
                startYear = currentYear + 1;
                return new Date(startYear, coupon.startMonth - 1, 1, 0, 0, 0);
            }
            return startDate;
        },
        getSeasonEndDate(coupon) {
            const currentYear = this.currentTime.getFullYear();
            let endYear = currentYear;

            if (coupon.startMonth > coupon.endMonth) {
                if (this.currentTime.getMonth() + 1 <= coupon.endMonth) {
                    endYear = currentYear;
                } else {
                    endYear = currentYear + 1;
                }
            }

            const lastDay = new Date(endYear, coupon.endMonth, 0).getDate();
            return new Date(endYear, coupon.endMonth - 1, lastDay, 23, 59, 59);
        },
        formatCountdown(ms) {
            const seconds = Math.floor(ms / 1000);
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m`;
            }
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            }
            return `${minutes}m ${secs}s`;
        },
        getStatusBadgeClass(coupon) {
            if (!coupon.isSeasonal) {
                if (coupon.status === 'Active') return 'status-active';
                return 'status-expired';
            }
            const phase = this.getSeasonPhase(coupon);
            if (!phase) return '';
            if (phase.type === 'active') return 'status-active';
            if (phase.type === 'upcoming') return 'status-upcoming';
            return 'status-expired';
        },
        isCardClickable(coupon) {
            if (!coupon.isSeasonal) return coupon.status === 'Active';
            const phase = this.getSeasonPhase(coupon);
            return phase && phase.type === 'active';
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card class="card">
            <div class="card_title">{{ $t('couponCodes.title') }}</div>
            <div class="card_content">{{ $t('couponCodes.content') }}</div>
        </mdui-card>

        <div v-if="CouponCodes.filter(c => c.isSeasonal).length > 0" class="seasonal_section">
            <mdui-card class="card">
                <div class="seasonal_header">
                    <mdui-icon name="event--outlined" class="seasonal_icon"></mdui-icon>
                    <div>
                        <div class="seasonal_title">{{ $t('couponCodes.seasonalCodes') }}</div>
                        <div class="seasonal_subtitle">{{ $t('couponCodes.seasonalSubtitle') }}</div>
                    </div>
                </div>
            </mdui-card>
            <div class="seasonal_codes_grid">
                <mdui-card v-for="coupon in CouponCodes.filter(c => c.isSeasonal)" :key="coupon.code"
                    class="seasonal_card" :class="{ 'card-active': isCardClickable(coupon) }">
                    <div class="seasonal_card_header">
                        <div class="seasonal_card_code">{{ coupon.code }}</div>
                    </div>

                    <div class="seasonal_phase" :class="getStatusBadgeClass(coupon)">
                        <div class="phase_label">{{ getSeasonPhase(coupon)?.label }}</div>
                        <div v-if="getSeasonPhase(coupon)?.countdown" class="phase_countdown">
                            <mdui-icon name="schedule--outlined" class="countdown_icon"></mdui-icon>
                            <span>{{ getSeasonPhase(coupon)?.countdown }}</span>
                        </div>
                    </div>

                    <div class="seasonal_card_actions">
                        <div class="season_months">
                            <mdui-icon name="calendar_month--outlined" class="month_icon"></mdui-icon>
                            <span>
                                {{ coupon.startMonth === coupon.endMonth
                                    ?
                                    `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
                                        'Dec'][coupon.startMonth
                                    - 1]}`
                                    :
                                    `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
                                        'Dec'][coupon.startMonth
                                    - 1]} -
                                ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
                                        'Dec'][coupon.endMonth
                                    - 1]}` }}
                            </span>
                        </div>
                        <mdui-button-icon variant="filled" icon="copy--outlined" :disabled="!isCardClickable(coupon)"
                            @click="copyCouponCode(coupon.code)">
                        </mdui-button-icon>
                    </div>
                </mdui-card>
            </div>
        </div>

        <mdui-card class="card">
            <div class="seasonal_header">
                <mdui-icon name="event--outlined" class="seasonal_icon"></mdui-icon>
                <div>
                    <div class="seasonal_title">{{ $t('couponCodes.normalCodes') }}</div>
                    <div class="seasonal_subtitle">{{ $t('couponCodes.normalSubtitle') }}</div>
                </div>
            </div>
        </mdui-card>
        <div class="couponCodes_list">
            <mdui-card v-for="couponCode in CouponCodes.filter(c => !c.isSeasonal)" :key="couponCode.code"
                class="couponCode_item">
                <div class="couponCode_info">
                    <div class="couponCode_name">{{ couponCode.code }}</div>
                    <div class="couponCode_status"
                        :class="couponCode.status === 'Active' ? 'status-active-small' : 'status-expired-small'">
                        {{ $t('couponCodes.' + (couponCode.status === 'Active' ? 'availableNow' : 'expired')) }}
                    </div>
                    <div v-if="couponCode.isPermanent" class="couponCode_permanent">
                        <mdui-icon name="all_inclusive--outlined" class="perm_icon"></mdui-icon>
                        {{ $t('couponCodes.permanent') }}
                    </div>
                </div>
                <div class="couponCode_button">
                    <mdui-button-icon @click="copyCouponCode(couponCode.code)" variant="standard" icon="copy--outlined"
                        :disabled="couponCode.status !== 'Active'"></mdui-button-icon>
                </div>
            </mdui-card>
        </div>
    </div>
</template>

<style scoped>
.seasonal_header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.seasonal_icon {
    font-size: 36px;
    color: var(--theme-color-2);
}

.seasonal_title {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
}

.seasonal_subtitle {
    font-size: 13px;
    color: var(--text-color-oc);
    margin-top: 4px;
}

.seasonal_codes_grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 8px;
    align-items: stretch;
    margin-bottom: 8px;
}

.seasonal_card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: all 0.2s ease;
    height: 100%;
    justify-content: space-between;
}

.seasonal_card.card-active {
    box-shadow: var(--mdui-elevation-level3);
}

.seasonal_card_header {
    display: flex;
    align-items: center;
}

.seasonal_card_code {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins Bold';
    letter-spacing: 0.5px;
}

.seasonal_phase {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
}

.phase_label {
    font-size: 13px;
    font-weight: bold;
    font-family: 'Poppins SemiBold';
}

.phase_countdown {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-family: 'Poppins SemiBold';
    font-variant-numeric: tabular-nums;
}

.countdown_icon {
    font-size: 16px;
}

.status-active {
    background: rgba(0, 200, 83, 0.12);
    color: #00c853;
}

.status-upcoming {
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
}

.status-expired {
    background: var(--text-color-oc-up);
    color: var(--text-color-oc);
}

.seasonal_card_actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 4px;
}

.season_months {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-color-oc);
}

.month_icon {
    font-size: 16px;
}

.normal_codes_title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.normal_icon {
    font-size: 28px;
    color: var(--theme-color-1);
}

.normal_subtitle {
    font-size: 12px;
    color: var(--text-color-oc);
    margin-top: 2px;
}

.couponCodes_list {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 6px;
    margin-bottom: 8px;
}

.couponCode_item {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
}

.couponCode_info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    flex: 1;
}

.couponCode_name {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
}

.couponCode_status {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: bold;
}

.status-active-small {
    background: rgba(0, 200, 83, 0.12);
    color: #00c853;
}

.status-expired-small {
    background: var(--text-color-oc-up);
    color: var(--text-color-oc);
}

.couponCode_permanent {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--theme-color-2);
    font-weight: bold;
}

.perm_icon {
    font-size: 14px;
}

.couponCode_button {
    flex-shrink: 0;
}

@media (max-width: 480px) {
    .seasonal_codes_grid {
        grid-template-columns: 1fr;
    }

    .couponCode_info {
        gap: 8px;
    }

    .couponCode_item {
        padding: 14px 16px;
    }
}
</style>
