<script>
import { snackbar } from 'mdui/functions/snackbar.js';

export default {
    data() {
        return {
            selectedCmd: null,
            formValues: {},
            weightRows: [{ tagValue: '', weight: 0 }],
            instructionList: [],
            expandedGroups: ['g0'],
            teleportSpots: [
                { name: 'SAW 翠竹山庄-舞台', x: 2579, y: 2390 },
                { name: 'SAW 翠竹山庄', x: 2575, y: 1713 },
                { name: '超级动物农场', x: 2715, y: 1283 },
                { name: '迷你牧场', x: 3127, y: 1464 },
                { name: 'SAW安保总部', x: 3430, y: 1850 },
                { name: 'PXL港口', x: 3920, y: 1575 },
                { name: '超级海洋乐园', x: 3875, y: 631 },
                { name: '鳄鱼俱乐部', x: 1740, y: 956 },
                { name: '仓鼠球竞技场', x: 1593, y: 475 },
                { name: 'SAW迎宾中心', x: 687, y: 701 },
                { name: '超级动物剧院', x: 800, y: 1330 },
                { name: '河狸建设总部', x: 1480, y: 1870 },
                { name: '超级金字塔', x: 1405, y: 2657 },
                { name: '巨型鸸鹋牧场', x: 1906, y: 2543 },
                { name: '超级紫晶山', x: 1311, y: 3266 },
                { name: '超级企鹅宫殿', x: 2174, y: 3547 },
                { name: 'SAW实验室', x: 2757, y: 3100 }
            ],
            commandGroups: [
                {
                    label: '大厅 / 赛前',
                    icon: 'meeting_room--outlined',
                    commands: [
                        { name: '/admin', cnName: '赋予/移除管理员', fields: [{ key: 'playerId', label: '玩家编号', type: 'text', required: true, placeholder: '输入玩家ID或all' }], notes: '再次使用会移除该玩家的管理员权限' },
                        { name: '/start', cnName: '开始倒计时（填充机器人）', fields: [], notes: '开始大厅倒计时，并填充机器人' },
                        { name: '/startp', cnName: '开始倒计时（不填充机器人）', fields: [], notes: '开始倒计时，不填充机器人' },
                        { name: '/flight', cnName: '重新生成巨鹰路径', fields: [], notes: '重新生成巨鹰飞行路径' },
                        { name: '/gasspeed', cnName: '调整毒气速度', fields: [{ key: 'speed', label: '速度倍率 (0.4 ~ 3.0)', type: 'number', min: 0.4, max: 3.0, step: 0.1, required: true }] },
                        { name: '/noboss', cnName: '开关boss生成', fields: [], notes: '第一次输入为关再次输入为撤回 | SvR模式特供，本场比赛不会刷新boss' },
                        { name: '/emus', cnName: '开关鸸鹋生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/utils', cnName: '开关超级神器生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/guns', cnName: '开关枪支生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/throwables', cnName: '开关投掷物生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/armors', cnName: '开关护甲生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/moles', cnName: '开关鼹鼠宝箱生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/hamballs', cnName: '开关仓鼠球生成', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/altars', cnName: '开关香蕉祭坛', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/tanks', cnName: '开关重生仓', fields: [], notes: '第一次输入为关再次输入为撤回 | 该指令会使本场比赛无法使用重生仓，死亡后也不会掉落DNA' },
                        { name: '/soccer', cnName: '生成足球', fields: [], notes: '生成一个足球（同时只能存在一个）' },
                        { name: '/saw', cnName: '移至SAW阵营', fields: [{ key: 'playerId', label: '玩家编号', type: 'text', required: true }], notes: '将指定玩家移动到SAW阵营' },
                        { name: '/rebel', cnName: '移至反抗军阵营', fields: [{ key: 'playerId', label: '玩家编号', type: 'text', required: true }], notes: '将指定玩家移动到反抗军阵营' },
                        { name: '/pet', cnName: '开关迷你动物', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/mystery', cnName: '强制切换模式', fields: [{ key: 'mode', label: '模式编号', type: 'number', required: true }], notes: '神秘模式切换模式（注意：切换到日当正午再切回其他模式，帽子不会恢复）' },
                        { name: '/weight', cnName: '设置生成权重', fields: [], isWeight: true, notes: '可同时设置多个标签，请注意顺序，总字符 ≤ 70 1是游戏正常的倍数。例如：先 all 0 再 gunak 5 (轮换武器当天没有轮换上，就算权重5也不会生成)' },
                        { name: '/gasoff', cnName: '禁用毒气', fields: [], notes: '禁用超级臭鼬毒气（仅在大厅或毒气生成前有效）' },
                        { name: '/gason', cnName: '启用毒气（可设延迟）', fields: [{ key: 'delay', label: '延迟秒数（可选，留空为立即）', type: 'number', min: 0, max: 999, placeholder: '可选' }], build: (v) => '/gason' + (v.delay ? ' ' + v.delay : '') },
                        { name: '/gasstart', cnName: '立即开始毒气倒计时', fields: [], notes: '立即开始首个毒气倒计时（若在大厅使用，巨鹰起飞时立即开始）' },
                    ]
                },
                {
                    label: '全局可用',
                    icon: 'sports_esports--outlined',
                    commands: [
                        { name: '/killfeed', cnName: '隐藏击杀播报', fields: [], notes: '第一次输入为关再次输入为撤回 | 此指令是对全体玩家生效，即使是ghost也无法看见击杀播报' },
                        { name: '/hidenames', cnName: '开关匿名模式', fields: [], notes: '第一次输入为关再次输入为撤回' },
                        { name: '/allchat', cnName: '全体禁言', fields: [], notes: '第一次输入为关再次输入为撤回 | 此指令是对全体玩家生效，主持人依然可以正常发言' },
                        { name: '/yell', cnName: '全体喊话', fields: [{ key: 'msg', label: '消息内容', type: 'text', required: true, placeholder: '输入你想说的话' }] },
                        { name: '/highping', cnName: '设置高延迟阈值', fields: [{ key: 'threshold', label: '阈值', type: 'number', min: 0, required: true }] },
                        { name: '/matchid', cnName: '显示战局代码', fields: [], notes: '显示并复制当前战局代码/密码' },
                        { name: '/night', cnName: '开关夜间模式', fields: [] },
                        { name: '/getpid', cnName: '显示我的编号', fields: [], notes: '显示你的玩家编号' },
                        { name: '/getplayers', cnName: '复制玩家列表', fields: [], notes: '复制所有玩家列表到剪贴板' },
                        { name: '/kick', cnName: '踢出玩家', fields: [{ key: 'playerId', label: '玩家编号', type: 'text', required: true }], notes: '踢出该玩家，他将无法再加入本局' },
                        {
                            name: '/tele', cnName: '传送玩家', fields: [
                                { key: 'target', label: '目标 (ID 或 all)', type: 'text', required: true, placeholder: '例: 3 或 all' },
                                { key: 'x', label: 'X 坐标 (0-4600)', type: 'number', min: 0, max: 4600, required: true },
                                { key: 'y', label: 'Y 坐标 (0-4600)', type: 'number', min: 0, max: 4600, required: true }
                            ], notes: '定点传送默认目标ALL，自定义传送需要自行修改XY和目标'
                        },
                        { name: '/getpos', cnName: '获取当前位置', fields: [], notes: '获取当前位置坐标' },
                        { name: '/ghost', cnName: '进入观战幽灵模式', fields: [{ key: 'playerId', label: '玩家ID（可选，留空为自己）注意使用后不能撤回', type: 'text', placeholder: '可选' }], build: (v) => '/ghost' + (v.playerId ? ' ' + v.playerId : '') },
                        { name: '/gasoff', cnName: '禁用毒气', fields: [], notes: '禁用毒气（仅在大厅或毒气生成前有效）' },
                        { name: '/gason', cnName: '启用毒气（可设延迟）', fields: [{ key: 'delay', label: '延迟秒数（可选）', type: 'number', min: 0, placeholder: '可选' }], build: (v) => '/gason' + (v.delay ? ' ' + v.delay : '') },
                        { name: '/gasstart', cnName: '立即开始毒气倒计时', fields: [], notes: '立即开始毒气倒计时' },
                        { name: '/gasdmg', cnName: '设置毒气伤害倍率', fields: [{ key: 'mult', label: '伤害倍率 (1.0 ~ 10.0)', type: 'number', min: 1, max: 10, step: 0.1, required: true }] },
                        { name: '/bulletspeed', cnName: '设置子弹速度倍率', fields: [{ key: 'mult', label: '速度倍率 (0.5 ~ 2.0)', type: 'number', min: 0.5, max: 2.0, step: 0.1, required: true }] },
                        { name: '/onehits', cnName: '开关一击必杀', fields: [], notes: '不适用于手榴弹和臭鼬弹' },
                        { name: '/god', cnName: '设置玩家无敌', fields: [{ key: 'playerId', label: '玩家编号或者all', type: 'text', required: true }], notes: '使该玩家无敌（仅免疫其他玩家伤害）再次使用就会取消' },
                        { name: '/dmg', cnName: '设置伤害倍率', fields: [{ key: 'mult', label: '倍率 (0 ~ 10)', type: 'number', min: 0, max: 10, step: 0.1, required: true }] },
                        { name: '/noroll', cnName: '超级翻滚', fields: [], notes: '对机器人无效(第一次输入为关再次输入为撤回)' },
                        { name: '/ziplines', cnName: '使用滑索', fields: [], notes: '不影响放置滑索(第一次输入为关再次输入为撤回)' },
                    ]
                },
                {
                    label: '游戏中',
                    icon: 'auto_fix_high--outlined',
                    commands: [
                        { name: '/score', cnName: '复制记分板', fields: [], notes: '复制记分板到剪贴板' },
                        { name: '/storm', cnName: '强制暴风雨', fields: [], notes: '强制触发暴风雨' },
                        { name: '/rain', cnName: '强制降雨', fields: [], notes: '强制触发降雨（一局仅一次）' },
                        { name: '/rainoff', cnName: '停止降雨', fields: [], notes: '强制结束降雨' },
                        { name: '/kill', cnName: '击杀玩家', fields: [{ key: 'playerId', label: '玩家编号或者all', type: 'text', required: true }], notes: '杀死指定玩家或机器人（需跳伞后生效）' },
                        { name: '/infect', cnName: '感染玩家（行鸡走肉）', fields: [{ key: 'playerId', label: '玩家编号', type: 'text', required: true }], notes: '行鸡走肉模式下感染该玩家' },
                        { name: '/banana', cnName: '生成香蕉', fields: [{ key: 'count', label: '数量', type: 'number', min: 1, max: 99, required: true }] },
                        { name: '/nade', cnName: '生成手榴弹', fields: [{ key: 'count', label: '数量', type: 'number', min: 1, max: 99, required: true }] },
                        { name: '/zip', cnName: '生成滑索', fields: [{ key: 'count', label: '数量', type: 'number', min: 1, max: 99, required: true }] },
                        { name: '/juice', cnName: '生成生命果汁', fields: [], notes: '生成生命果汁' },
                        { name: '/tape', cnName: '生成超级胶带', fields: [], notes: '生成超级胶带' },
                        { name: '/hamball', cnName: '生成仓鼠球', fields: [], notes: '立即生成一个仓鼠球（总数有限）' },
                        { name: '/emu', cnName: '生成鸸鹋', fields: [], notes: '立即生成一只鸸鹋（类型随机，总数有限）' },
                        { name: '/giant', cnName: '生成巨大树懒', fields: [], notes: '生成一个巨大树懒，若场上已经有巨大树懒则为清除' },
                        { name: '/boss', cnName: '生成超级星鼻鼹', fields: [], notes: '生成超级星鼻鼹' },
                        {
                            name: '/gun', cnName: '生成指定武器', notes: '武器编号 (0-24) 0-手枪 1-双持 2-左轮 3-沙鹰 4-消音 5-霰弹 6-虎喷 7-冲锋枪 8-托马斯 9-AK 10-M16 11-飞镖枪 12-大飞镖枪 13-猎枪 14-狙击枪 15-能量枪 16-X激光炮 17-机枪 18-弓 19-弩 20-BCG 21-三管 22-尸弩 23-《孙宇智》24-《两个孙宇智》', fields: [
                                { key: 'gunId', label: '武器编号', type: 'number', min: 0, max: 19, required: true },
                                { key: 'rarity', label: '稀有度 (0普通 / 1罕见 / 2稀有/ 3史诗/4传说，可选)', type: 'number', min: 0, max: 2, placeholder: '可选' }
                            ], build: (v) => { let s = '/gun' + v.gunId; if (v.rarity !== undefined && v.rarity !== '') s += ' ' + v.rarity; return s; }
                        },
                        {
                            name: '/util', cnName: '生成超级神器', fields: [
                                { key: 'utilId', label: '编号 (0-6)', type: 'number', min: 0, max: 6, required: true }
                            ], build: (v) => '/util' + v.utilId, notes: '编号参考: 0-爪爪战靴 1-香蕉叉叉 2-忍者神靴 3-臭鼬毒气呼吸器 4-金色生命果汁杯 5-超级弹挂 6-SAW玄学胶带'
                        },
                        {
                            name: '/ammo', cnName: '生成子弹', fields: [
                                { key: 'type', label: '子弹类型编号', type: 'number', required: true },
                                { key: 'count', label: '数量', type: 'number', min: 1, required: true }
                            ], build: (v) => { let s = '/ammo' + v.type; if (v.count !== undefined && v.count !== '') s += ' ' + v.count; return s; }, notes: '编号参考:0-小型子弹 1-霰弹 2-大型子弹 3-狙击子弹 4-特殊子弹 5-紫晶弹药'
                        },
                        {
                            name: '/ammo', cnName: '生成子弹', fields: [
                                { key: 'type', label: '子弹类型编号', type: 'number', required: true },
                                { key: 'count', label: '数量', type: 'number', min: 1, required: true }
                            ], build: (v) => '/ammo' + v.type + ' ' + v.count
                        },
                        {
                            name: '/armor', cnName: '生成护甲', fields: [
                                { key: 'level', label: '等级 (1-3)', type: 'number', min: 1, max: 3, required: true }
                            ], build: (v) => '/armor' + v.level
                        },
                    ]
                }
            ],
            presets: [
                { name: '获取比赛代码', data: { cmd: '/matchid' } },
                { name: '武器权重', data: { cmd: '/weight', weightRows: [{ tagValue: '', weight: 0 }, { tagValue: '', weight: 0 }, { tagValue: '', weight: 0 }, { tagValue: '', weight: 0 }] } },
                { name: '开始游戏', data: { cmd: '/start' } },
                { name: '开始游戏(不添加BOT)', data: { cmd: '/startp' } },
                { name: '传送', data: { cmd: '/tele', target: '', x: '', y: '' } },
            ],
            weightTags: [
                { label: '全部', value: 'all' },
                { label: '手枪类', value: 'pistol' },
                { label: '霰弹枪类', value: 'Shotgun' },
                { label: '冲锋枪类', value: 'Smg' },
                { label: '步枪类', value: 'rifle' },
                { label: '毒镖枪类', value: 'dart' },
                { label: '狙击枪类', value: 'sniper' },
                { label: '激光枪', value: 'lmg' },
                { label: '弓弩类', value: 'bow' },
                { label: '重型武器', value: 'heavy' },
                { label: '招财猫地雷', value: 'mine' },
                { label: '手枪', value: 'gunpistol' },
                { label: '双持手枪', value: 'gundualpistol' },
                { label: '马格南', value: 'gunmagnum' },
                { label: '沙鹰', value: 'gundeagle' },
                { label: '消音手枪', value: 'gunsilencedpistol' },
                { label: '霰弹枪', value: 'gunshotgun' },
                { label: '豹动式霰弹枪', value: 'gunjag7' },
                { label: '冲锋枪', value: 'gunsmg' },
                { label: '托马斯冲锋枪', value: 'gunthomas' },
                { label: 'AK', value: 'gunak' },
                { label: 'M16', value: 'gunm16' },
                { label: '毒镖枪', value: 'gundart' },
                { label: '蝇镖枪', value: 'gundartepic' },
                { label: '猎枪', value: 'gunhuntingrifle' },
                { label: '狙击枪', value: 'gunsniper' },
                { label: '紫晶激光枪', value: 'gunlaser' },
                { label: '机枪', value: 'gunminigun' },
                { label: '弓与箭', value: 'gunbow' },
                { label: '十字弩', value: 'guncrossbow' },
                { label: '大鳱枪', value: 'gunegglauncher' },
                { label: '《孙宇智》', value: 'gunuzi' },
                { label: '《两个孙宇智》', value: 'gundualuzi' },
                { label: '小牛犬步枪', value: 'gunburst' },
                { label: '三筒雷管', value: 'gunblunderbuss' },
                { label: '尸弩', value: 'guncrossbowzombie' },
                { label: '手榴弹', value: 'grenadefrag' },
                { label: '香蕉', value: 'grenadebanana' },
                { label: '臭鼬弹', value: 'grenadeskunk' },
                { label: '招财猫地雷', value: 'grenadecatmine' },
                { label: '滑索', value: 'grenadezipline' },
            ]
        }
    },
    computed: {
        isWeightCmd() {
            return this.selectedCmd && this.selectedCmd.isWeight;
        },
        currentCmdStr() {
            if (!this.selectedCmd) return '';
            const v = this.formValues;
            if (this.isWeightCmd) {
                const rows = this.weightRows.filter(r => r.tagValue && r.weight !== undefined && r.weight !== null && r.weight !== '');
                if (rows.length === 0) return '/weight';
                let parts = ['/weight'];
                for (let row of rows) {
                    parts.push(row.tagValue);
                    parts.push(String(row.weight));
                }
                return parts.join(' ');
            }
            if (this.selectedCmd.build) {
                return this.selectedCmd.build(v);
            }
            let params = this.selectedCmd.fields
                .filter(f => f.required || (v[f.key] !== undefined && v[f.key] !== ''))
                .map(f => v[f.key])
                .join(' ');
            return '/' + this.selectedCmd.name.replace('/', '') + (params ? ' ' + params : '');
        },
        currentCharCount() {
            return this.currentCmdStr.length;
        },
        canAdd() {
            return this.currentCmdStr && this.currentCharCount <= 70;
        }
    },
    mounted() {
        if (this.commandGroups.length > 0 && this.commandGroups[0].commands.length > 0) {
            this.selectCmd(this.commandGroups[0].commands[0]);
        }
    },
    methods: {
        selectCmd(cmd) {
            this.selectedCmd = cmd;
            this.formValues = {};
            this.weightRows = [{ tagValue: '', weight: 0 }];
            if (cmd.fields) {
                cmd.fields.forEach(f => {
                    this.formValues[f.key] = f.default !== undefined ? f.default : '';
                });
            }
        },
        setFormValue(key, value) {
            this.formValues[key] = value;
        },
        addWeightRow() {
            this.weightRows.push({ tagValue: '', weight: 0 });
        },
        removeWeightRow(idx) {
            this.weightRows.splice(idx, 1);
        },
        addToList() {
            if (!this.canAdd) return;
            const str = this.currentCmdStr.trim();
            if (str) {
                this.instructionList.push({ text: str, chars: str.length });
            }
        },
        onTeleportSpotChange(name) {
            if (!name) return;
            const spot = this.teleportSpots.find(s => s.name === name);
            if (spot) {
                this.formValues.target = 'all';
                this.formValues.x = spot.x;
                this.formValues.y = spot.y;
            }
        },
        copySingle(text) {
            const done = () => snackbar({ message: this.$t('commands.copied') });
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => {
                    this.fallbackCopy(text);
                    done();
                });
            } else {
                this.fallbackCopy(text);
                done();
            }
        },
        fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        },
        clearList() {
            this.instructionList = [];
        },
        loadPreset(preset) {
            const data = preset.data;
            let cmd = null;
            for (let g of this.commandGroups) {
                cmd = g.commands.find(c => c.name === data.cmd);
                if (cmd) break;
            }
            if (!cmd) {
                snackbar({ message: '预设指令不存在' });
                return;
            }
            this.selectCmd(cmd);
            if (data.cmd === '/weight') {
                this.weightRows = data.weightRows.map(r => ({ ...r }));
            } else if (data.target !== undefined) {
                this.formValues.target = data.target;
                this.formValues.x = data.x;
                this.formValues.y = data.y;
            } else if (data.extra) {
                data.extra.forEach(cmdName => {
                    this.instructionList.push({ text: cmdName, chars: cmdName.length });
                });
            }
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card class="card">
            <div class="card_title">{{ $t('commands.title') }}</div>
            <div class="card_content">{{ $t('commands.content') }}</div>
        </mdui-card>
        <div class="panel_main">
            <mdui-card class="panel output_card">
                <div class="panel_title">
                    <mdui-icon name="list--outlined"></mdui-icon>
                    <span>{{ $t('commands.list') }}</span>
                    <mdui-button v-if="instructionList.length > 0" variant="text" icon="delete_sweep--outlined"
                        @click="clearList">{{ $t('commands.clear') }}</mdui-button>
                </div>

                <div v-if="instructionList.length > 0" class="instruction_list">
                    <mdui-card v-for="(item, idx) in instructionList" :key="idx" variant="filled"
                        class="instruction_item">
                        <span class="item_text">{{ item.text }}</span>
                        <div class="item_right">
                            <span class="item_chars" :class="item.chars <= 70 ? 'ok' : 'err'">{{ item.chars }}</span>
                            <mdui-button-icon icon="content_copy--outlined"
                                @click="copySingle(item.text)"></mdui-button-icon>
                        </div>
                    </mdui-card>
                </div>
                <div v-else class="empty_state">
                    <mdui-icon name="inbox--outlined"></mdui-icon>
                    <p>{{ $t('commands.empty') }}</p>
                </div>

                <mdui-button full-width variant="filled" icon="add_circle--outlined" :disabled="!canAdd"
                    @click="addToList">{{
                        $t('commands.add') }}</mdui-button>
                <div v-if="!canAdd && currentCmdStr" class="cannot_add">{{ $t('commands.cannotAdd') }}</div>
            </mdui-card>
            <mdui-card class="panel form_card">
                <div class="panel_title">
                    <mdui-icon name="build--outlined"></mdui-icon>
                    <span>{{ selectedCmd ? (selectedCmd.cnName || selectedCmd.name) : $t('commands.selectHint')
                    }}</span>
                </div>
                <div class="presets">
                    <span class="presets_label">{{ $t('commands.presets') }}</span>
                    <mdui-chip v-for="(preset, idx) in presets" :key="idx" @click="loadPreset(preset)">{{ preset.name }}
                    </mdui-chip>
                </div>
                <div v-if="selectedCmd" class="cmd_form">
                    <template v-for="field in selectedCmd.fields" :key="field.key">
                        <mdui-select v-if="field.type === 'select'" variant="outlined"
                            :label="field.label + (field.required ? ' *' : '')" :value="formValues[field.key]"
                            @change="setFormValue(field.key, $event.target.value)">
                            <mdui-menu-item v-for="opt in field.options" :key="opt.value" :value="opt.value">{{
                                opt.label }}
                            </mdui-menu-item>
                        </mdui-select>
                        <mdui-text-field v-else variant="outlined" :type="field.type === 'number' ? 'number' : 'text'"
                            :label="field.label + (field.required ? ' *' : '')" :value="formValues[field.key]"
                            :min="field.min" :max="field.max" :step="field.step" :placeholder="field.placeholder || ''"
                            :helper="field.desc"
                            @input="setFormValue(field.key, $event.target.value)"></mdui-text-field>
                    </template>
                    <mdui-select v-if="selectedCmd.name === '/tele'" variant="outlined"
                        :label="$t('commands.teleportLabel')" :placeholder="$t('commands.teleportPlaceholder')"
                        @change="onTeleportSpotChange($event.target.value)">
                        <mdui-menu-item value="">{{ $t('commands.teleportPlaceholder') }}</mdui-menu-item>
                        <mdui-menu-item v-for="spot in teleportSpots" :key="spot.name" :value="spot.name">{{ spot.name
                        }}
                        </mdui-menu-item>
                    </mdui-select>
                    <div v-if="isWeightCmd" class="weight_block">
                        <div class="form_label">{{ $t('commands.weightLabel') }}</div>
                        <div class="weight_dynamic">
                            <div v-for="(row, rIdx) in weightRows" :key="rIdx" class="weight_row">
                                <mdui-select class="weight_select" variant="outlined"
                                    :placeholder="$t('commands.weightPlaceholder')" :value="row.tagValue"
                                    @change="row.tagValue = $event.target.value">
                                    <mdui-menu-item v-for="tag in weightTags" :key="tag.value" :value="tag.value">{{
                                        tag.label }}</mdui-menu-item>
                                </mdui-select>
                                <mdui-text-field class="weight_input" variant="outlined" type="number" min="0" max="5"
                                    step="0.1" :value="row.weight" :placeholder="$t('commands.weightPlaceholderShort')"
                                    @input="row.weight = $event.target.value"></mdui-text-field>
                                <mdui-button-icon v-if="weightRows.length > 1" icon="remove_circle--outlined"
                                    @click="removeWeightRow(rIdx)"></mdui-button-icon>
                            </div>
                        </div>
                        <mdui-button variant="tonal" icon="add--outlined" @click="addWeightRow">{{
                            $t('commands.weightAdd')
                        }}
                        </mdui-button>
                    </div>
                    <mdui-card v-if="selectedCmd.notes" variant="filled" class="notes_card">
                        <mdui-icon name="info--outlined"></mdui-icon>
                        <span>{{ selectedCmd.notes }}</span>
                    </mdui-card>
                    <div v-if="currentCmdStr" class="preview_area">
                        <div class="preview_label">
                            <mdui-icon name="visibility--outlined"></mdui-icon>
                            <span>{{ $t('commands.preview') }}</span>
                            <mdui-button-icon icon="content_copy--outlined"
                                @click="copySingle(currentCmdStr)"></mdui-button-icon>
                        </div>
                        <div class="preview_text">{{ currentCmdStr }}</div>
                        <div class="preview_chars"
                            :class="{ ok: currentCharCount <= 70, warn: currentCharCount > 55 && currentCharCount <= 70, err: currentCharCount > 70 }">
                            {{ $t('commands.chars') }}{{ currentCharCount }} / 70
                            <span v-if="currentCharCount > 70">⚠️ {{ $t('commands.overlimit') }}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="empty_state">
                    <mdui-icon name="touch_app--outlined"></mdui-icon>
                    <p>{{ $t('commands.emptyHint') }}</p>
                </div>
            </mdui-card>
            <mdui-card class="panel catalog_card">
                <div class="panel_title">
                    <mdui-icon name="list_alt--outlined"></mdui-icon>
                    <span>{{ $t('commands.catalog') }}</span>
                </div>
                <mdui-collapse :value="expandedGroups" @change="expandedGroups = $event.target.value">
                    <mdui-collapse-item v-for="(group, gIdx) in commandGroups" :key="group.label" :value="'g' + gIdx">
                        <mdui-list-item :icon="group.icon" slot="header">
                            {{ group.label }}
                        </mdui-list-item>
                        <div>
                            <mdui-list-item v-for="cmd in group.commands" :key="cmd.name" rounded
                                :active="selectedCmd && selectedCmd.name === cmd.name" @click="selectCmd(cmd)">
                                {{ cmd.cnName || cmd.name }}</mdui-list-item>
                        </div>
                    </mdui-collapse-item>
                </mdui-collapse>
            </mdui-card>
        </div>
    </div>
</template>

<style scoped>
@media screen and (max-width: 1300px) {
    .panel_main {
        grid-template-columns: 1fr !important;
    }
}

.panel_main {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
}

.panel {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.panel_title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
}

.panel_title span {
    flex: 1;
    min-width: 0;
}

.presets {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.presets_label {
    font-size: 13px;
    color: var(--text-color-oc);
}

.cmd_form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.weight_block {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form_label {
    font-size: 13px;
    color: var(--text-color-oc);
}

.weight_dynamic {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.weight_row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.weight_select {
    flex: 1;
    min-width: 0;
}

.weight_input {
    width: 110px;
    flex-shrink: 0;
}

.notes_card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--text-color-oc);
    line-height: 1.5;
}

.notes_card mdui-icon {
    color: var(--theme-color-2);
    flex-shrink: 0;
}

.preview_area {
    background: var(--theme-color-2-oc-up);
    border-radius: var(--card-border-radius);
    padding: 12px;
}

.preview_label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-color-oc);
    margin-bottom: 6px;
}

.preview_label span {
    flex: 1;
}

.preview_text {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    word-break: break-all;
    line-height: 1.5;
    color: var(--text-color);
    min-height: 24px;
}

.preview_chars {
    margin-top: 6px;
    font-size: 13px;
}

.preview_chars.ok {
    color: #00c853;
}

.preview_chars.warn {
    color: #e67e22;
}

.preview_chars.err {
    color: #dc2626;
}

.instruction_list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
}

.instruction_item {
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.item_text {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    word-break: break-all;
    flex: 1;
    line-height: 1.4;
    color: var(--text-color);
}

.item_right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.item_chars {
    font-size: 12px;
    font-weight: bold;
}

.item_chars.ok {
    color: #00c853;
}

.item_chars.err {
    color: #dc2626;
}

.empty_state {
    text-align: center;
    color: var(--text-color-oc);
    padding: 24px 8px;
}

.empty_state mdui-icon {
    font-size: 40px;
    opacity: 0.5;
}

.empty_state p {
    margin: 8px 0 0;
    font-size: 13px;
}

.cannot_add {
    color: #dc2626;
    font-size: 12px;
    text-align: center;
}

@media (max-width: 1280px) {
    .command_layout {
        grid-template-columns: 240px minmax(0, 1fr);
    }

    .output_card {
        grid-column: 1 / -1;
    }

    .catalog_card {
        max-height: none;
    }
}

@media (max-width: 800px) {
    .command_layout {
        grid-template-columns: 1fr;
    }

    .catalog_card {
        position: static;
    }
}
</style>
