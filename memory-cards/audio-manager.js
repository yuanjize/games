/**
 * AudioManager - Web Audio API 音效管理器
 * 为记忆翻牌游戏提供完整的音效系统
 */

class AudioManager {
    constructor() {
        // 音频上下文
        this.audioCtx = null;
        this.masterGain = null;

        // 音效设置
        this.settings = {
            enabled: true,
            volume: 0.5,  // 0.0 - 1.0
            sfxVolume: 0.5,
            musicVolume: 0.3
        };

        // 音效预设
        this.soundPresets = {
            // 翻牌音效
            flip: {
                type: 'sequence',
                sounds: [
                    { freq: 600, duration: 0.05, type: 'sine', volume: 0.3 },
                    { freq: 800, duration: 0.03, type: 'sine', volume: 0.2 }
                ]
            },

            // 配对成功音效
            match: {
                type: 'sequence',
                sounds: [
                    { freq: 880, duration: 0.08, type: 'sine', volume: 0.35 },
                    { freq: 1100, duration: 0.12, type: 'sine', volume: 0.3 }
                ]
            },

            // 配对失败音效
            noMatch: {
                type: 'sequence',
                sounds: [
                    { freq: 300, duration: 0.1, type: 'triangle', volume: 0.25 },
                    { freq: 200, duration: 0.1, type: 'triangle', volume: 0.2 }
                ]
            },

            // 胜利音效（和弦）
            win: {
                type: 'chord',
                sounds: [
                    { freq: 523.25, duration: 0.2, type: 'sine', volume: 0.3 },  // C5
                    { freq: 659.25, duration: 0.2, type: 'sine', volume: 0.3 },  // E5
                    { freq: 783.99, duration: 0.25, type: 'sine', volume: 0.35 }, // G5
                    { freq: 1046.50, duration: 0.35, type: 'sine', volume: 0.4 } // C6
                ],
                delay: 120
            },

            // 暂停音效
            pause: {
                type: 'single',
                sound: { freq: 400, duration: 0.1, type: 'square', volume: 0.2 }
            },

            // 继续音效
            resume: {
                type: 'single',
                sound: { freq: 600, duration: 0.1, type: 'square', volume: 0.2 }
            },

            // UI点击音效
            click: {
                type: 'single',
                sound: { freq: 800, duration: 0.05, type: 'sine', volume: 0.15 }
            },

            // 主题切换音效
            themeSwitch: {
                type: 'sequence',
                sounds: [
                    { freq: 700, duration: 0.08, type: 'triangle', volume: 0.25 },
                    { freq: 900, duration: 0.08, type: 'triangle', volume: 0.2 }
                ]
            },

            // 新记录音效
            newRecord: {
                type: 'fanfare',
                sounds: [
                    { freq: 523.25, duration: 0.15, type: 'sine', volume: 0.35 },
                    { freq: 659.25, duration: 0.15, type: 'sine', volume: 0.35 },
                    { freq: 783.99, duration: 0.2, type: 'sine', volume: 0.4 },
                    { freq: 1046.50, duration: 0.15, type: 'sine', volume: 0.35 },
                    { freq: 1318.51, duration: 0.25, type: 'sine', volume: 0.4 }
                ],
                delay: 100
            },

            // 难度切换音效
            difficultyChange: {
                type: 'single',
                sound: { freq: 1000, duration: 0.08, type: 'sine', volume: 0.25 }
            },

            // 帮助打开音效
            helpOpen: {
                type: 'single',
                sound: { freq: 900, duration: 0.1, type: 'triangle', volume: 0.2 }
            },

            // 帮助关闭音效
            helpClose: {
                type: 'single',
                sound: { freq: 700, duration: 0.1, type: 'triangle', volume: 0.2 }
            }
        };

        // 从 localStorage 加载设置
        this.loadSettings();
    }

    /**
     * 初始化音频上下文
     */
    async init() {
        if (this.audioCtx) return true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            // 创建主音量控制
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.settings.volume;
            this.masterGain.connect(this.audioCtx.destination);

            // 恢复音频上下文（如果被挂起）
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            return true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            return false;
        }
    }

    /**
     * 播放单个音符
     */
    playNote(freq, type, duration, volume, slide = 0) {
        if (!this.audioCtx || !this.settings.enabled) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        // 频率滑动效果
        if (slide !== 0) {
            osc.frequency.linearRampToValueAtTime(
                freq + slide,
                this.audioCtx.currentTime + duration
            );
        }

        // 音量包络
        const now = this.audioCtx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * this.settings.volume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(now + duration);
    }

    /**
     * 播放音效预设
     */
    play(soundName, customVolume = null) {
        if (!this.settings.enabled) return;
        if (!this.audioCtx) this.init();

        const preset = this.soundPresets[soundName];
        if (!preset) {
            console.warn(`Sound preset "${soundName}" not found`);
            return;
        }

        if (preset.type === 'single') {
            const sound = preset.sound;
            const volume = customVolume !== null ? customVolume : sound.volume;
            this.playNote(sound.freq, sound.type, sound.duration, volume);
        } else if (preset.type === 'sequence') {
            preset.sounds.forEach((sound, index) => {
                setTimeout(() => {
                    const volume = customVolume !== null ? customVolume : sound.volume;
                    this.playNote(sound.freq, sound.type, sound.duration, volume);
                }, index * 80);
            });
        } else if (preset.type === 'chord' || preset.type === 'fanfare') {
            preset.sounds.forEach((sound, index) => {
                setTimeout(() => {
                    const volume = customVolume !== null ? customVolume : sound.volume;
                    this.playNote(sound.freq, sound.type, sound.duration, volume);
                }, index * (preset.delay || 150));
            });
        }
    }

    /**
     * 播放翻牌音效
     */
    playFlip() {
        this.play('flip');
    }

    /**
     * 播放配对成功音效
     */
    playMatch() {
        this.play('match');
    }

    /**
     * 播放配对失败音效
     */
    playNoMatch() {
        this.play('noMatch');
    }

    /**
     * 播放胜利音效
     */
    playWin() {
        this.play('win');
    }

    /**
     * 播放新记录音效
     */
    playNewRecord() {
        this.play('newRecord');
    }

    /**
     * 播放暂停音效
     */
    playPause() {
        this.play('pause');
    }

    /**
     * 播放继续音效
     */
    playResume() {
        this.play('resume');
    }

    /**
     * 播放点击音效
     */
    playClick() {
        this.play('click');
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.settings.volume,
                this.audioCtx.currentTime
            );
        }
        this.saveSettings();
    }

    /**
     * 获取音量
     */
    getVolume() {
        return this.settings.volume;
    }

    /**
     * 启用/禁用音效
     */
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        this.saveSettings();

        // 播放确认音效
        if (this.settings.enabled) {
            this.init().then(() => {
                this.playClick();
            });
        }

        return this.settings.enabled;
    }

    /**
     * 检查音效是否启用
     */
    isEnabled() {
        return this.settings.enabled;
    }

    /**
     * 预览音效
     */
    previewSound(soundName) {
        if (!this.audioCtx) {
            this.init().then(() => {
                this.play(soundName);
            });
        } else {
            this.play(soundName);
        }
    }

    /**
     * 保存设置到 localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('memoryCardsAudioSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }

    /**
     * 从 localStorage 加载设置
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem('memoryCardsAudioSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
        }
    }

    /**
     * 重置设置为默认值
     */
    resetSettings() {
        this.settings = {
            enabled: true,
            volume: 0.5,
            sfxVolume: 0.5,
            musicVolume: 0.3
        };
        this.setVolume(0.5);
        this.saveSettings();
    }
}

// 导出为全局对象
window.AudioManager = AudioManager;
