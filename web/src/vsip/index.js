import JsSIP from 'jssip';
import {forEach} from 'p-iteration';
import WebRTCMetrics from "./helpers/webrtcmetrics/index";
import {setupTime} from "./helpers/time.helper"
import {filterObjectkeys} from "./helpers/filter.helper";

import {
    STORAGE_KEYS,
    STORE_MUTATION_TYPES,
    CALL_EVENT_LISTENER_TYPE,
    CONSTRAINTS,
    CALL_KEYS_TO_INCLUDE,
    METRIC_KEYS_TO_INCLUDE
} from './config/enum'

/**
 * @typedef {Object} VSIPOptions
 * @property {Object} store - Vuex store
 */

/**
 * @typedef {Object} RoomInfo
 * @property {Date} started
 * @property {Number} roomId
 */

/**
 * @typedef {Object} RoomList
 * @property {RoomInfo} roomId
 */

let UA;

function simplifyCallObject(call) {
    let simplified = {};

    CALL_KEYS_TO_INCLUDE.forEach(key => {
        if (call[key] !== undefined) {
            simplified[key] = call[key]
        }
    })

    return simplified
}

function getNewRoomId(activeRooms) {
    const roomIdList = Object.keys(activeRooms);

    if (roomIdList.length === 0) {
        return 1;
    }

    return (parseInt(roomIdList.sort()[roomIdList.length - 1]) + 1);
}

function syncStream(event, call, outputDevice, volume) {
    const audio = document.createElement('audio');

    audio.id = call._id;
    audio.class = 'audioTag';
    audio.srcObject = event.stream;
    audio.setSinkId(outputDevice);
    audio.volume = volume;
    audio.play();
    call.audioTag = audio;
}

function processAudioVolume(stream, volume) {
    let audioContext = new AudioContext()
    let audioSource = audioContext.createMediaStreamSource(stream)
    let audioDestination = audioContext.createMediaStreamDestination();
    let gainNode = audioContext.createGain();
    audioSource.connect(gainNode);
    gainNode.connect(audioDestination);
    gainNode.gain.value = volume;

    return audioDestination.stream
}

let activeCalls = {};

/**
 * @param {VSIPOptions} options
 */
function initStoreModule(options) {
    if (!options || !options.store) {
        throw new Error('Please initialise plugin with a Vuex store.');
    }

    options.store.registerModule('vsip', {
        namespaced: true,
        state: {
            activeCalls: {},
            /** @type RoomList */
            activeRooms: {},
            availableMediaDevices: [],
            selectedMediaDevices: {
                input: localStorage.getItem(STORAGE_KEYS.SELECTED_INPUT_DEVICE) || 'default',
                output: localStorage.getItem(STORAGE_KEYS.SELECTED_OUTPUT_DEVICE) || 'default'
            },
            currentActiveRoomId: null,
            muteWhenJoin: false,
            uaInit: false,
            sipDomain: '',
            sipOptions: {},
            listeners: {},
            callAddingInProgress: null,
            isDND: false,
            isMuted: false,
            originalStream: null,
            microphoneInputLevel: 2, // from 0 to 2
            speakerVolume: 1, // from 0 to 1
            metricConfig: {
                refreshEvery: 1000,
            },
            callTime: {},
            callMetrics: {},
            callStatus: {},
            timeIntervals: {}
        },
        mutations: {
            [STORE_MUTATION_TYPES.SET_DND]: (state, value) => {
                state.isDND = value;
            },
            [STORE_MUTATION_TYPES.SET_METRIC_CONFIG]: (state, config) => {
                state.metricConfig = {...state.metricConfig, ...config};
            },
            [STORE_MUTATION_TYPES.SET_MUTED]: (state, value) => {
                state.isMuted = value;
            },
            [STORE_MUTATION_TYPES.SET_ORIGINAL_STREAM]: (state, value) => {
                state.originalStream = value;
            },
            [STORE_MUTATION_TYPES.CALL_ADDING_IN_PROGRESS]: (state, value) => {
                state.callAddingInProgress = value;
            },
            [STORE_MUTATION_TYPES.SET_MUTED_WHEN_JOIN]: (state, value) => {
                state.muteWhenJoin = value;
            },
            [STORE_MUTATION_TYPES.ADD_LISTENER]: (state, {type, listener}) => {
                const isListenerEmpty = !state.listeners[type] || !state.listeners[type].length
                const newListeners = isListenerEmpty? [listener]: [...state.listeners[type], listener]

                state.listeners = {
                    ...state.listeners,
                    [type]: newListeners
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_LISTENER]: (state, value) => {
                const listenersCopy = {...state.listeners};
                delete listenersCopy[value];

                state.listeners = {
                    ...listenersCopy,
                }
            },
            [STORE_MUTATION_TYPES.SET_MEDIA_DEVICES]: (state, value) => {
                state.availableMediaDevices = value;
            },
            [STORE_MUTATION_TYPES.SET_UA_INIT]: (state) => {
                state.uaInit = true
            },
            [STORE_MUTATION_TYPES.SET_SELECTED_INPUT_DEVICE]: (state, value) => {
                localStorage.setItem(STORAGE_KEYS.SELECTED_INPUT_DEVICE, value);

                state.selectedMediaDevices.input = value;
            },
            [STORE_MUTATION_TYPES.SET_SELECTED_OUTPUT_DEVICE]: (state, value) => {
                localStorage.setItem(STORAGE_KEYS.SELECTED_OUTPUT_DEVICE, value);

                state.selectedMediaDevices.output = value;
            },
            [STORE_MUTATION_TYPES.SET_MICROPHONE_INPUT_LEVEL]: (state, value) => {
                state.microphoneInputLevel = value;
            },
            [STORE_MUTATION_TYPES.SET_SPEAKER_VOLUME]: (state, value) => {
                state.speakerVolume = value;
            },
            [STORE_MUTATION_TYPES.UPDATE_CALL]: (state, value) => {
                state.activeCalls = {
                    ...state.activeCalls,
                    [value._id]: simplifyCallObject(value)
                }
            },
            [STORE_MUTATION_TYPES.ADD_CALL]: (state, value) => {
                state.activeCalls = {
                    ...state.activeCalls,
                    [value._id]: simplifyCallObject(value)
                }

                activeCalls[value._id] = value
            },
            [STORE_MUTATION_TYPES.REMOVE_CALL]: (state, value) => {
                const stateActiveCallsCopy = {...state.activeCalls};
                delete stateActiveCallsCopy[value];

                delete activeCalls[value];
                state.activeCalls = {
                    ...stateActiveCallsCopy,
                }
            },
            [STORE_MUTATION_TYPES.SET_CALL_TIME]: (state, value) => {
                const time = { ...value }
                delete time['callId']

                state.callTime = {
                    ...state.callTime,
                    [value.callId]: time
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_CALL_TIME]: (state, callId) => {
                const callTimeCopy = {...state.callTime};
                delete callTimeCopy[callId];

                state.callTime = {
                    ...callTimeCopy,
                }
            },
            [STORE_MUTATION_TYPES.SET_TIME_INTERVAL]: (state, {callId, interval}) => {
                state.timeIntervals = {
                    ...state.timeIntervals,
                    [callId]: interval
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_TIME_INTERVAL]: (state, callId) => {
                const timeIntervalsCopy = {...state.timeIntervals};
                clearInterval(timeIntervalsCopy[callId]);
                delete timeIntervalsCopy[callId];

                state.timeIntervals = {
                    ...timeIntervalsCopy,
                }
            },
            [STORE_MUTATION_TYPES.SET_CALL_METRICS]: (state, value) => {
                const metrics = { ...value }
                delete metrics['callId']

                state.callMetrics = {
                    ...state.callMetrics,
                    [value.callId]: metrics
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_CALL_METRICS]: (state, callId) => {
                const callMetricsCopy = {...state.callMetrics};
                delete callMetricsCopy[callId];

                state.callMetrics = {
                    ...callMetricsCopy,
                }
            },
            [STORE_MUTATION_TYPES.ADD_CALL_STATUS]: (state, callId) => {
                state.callStatus = {
                    ...state.callStatus,
                    [callId]: {
                        isMoving: false,
                        isTransferring: false,
                        isMerging: false
                    }
                }
            },
            [STORE_MUTATION_TYPES.UPDATE_CALL_STATUS]: (state, value) => {
                const prevStatus = state.callStatus[value.callId]
                const newStatus = { ...value }
                delete newStatus['callId']

                state.callStatus = {
                    ...state.callStatus,
                    [value.callId]: {
                        ...prevStatus,
                        ...newStatus
                    }
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_CALL_STATUS]: (state, callId) => {
                const callStatusCopy = {...state.callStatus};
                delete callStatusCopy[callId];

                state.callStatus = {
                    ...callStatusCopy,
                }
            },
            /**
             * @param state
             * @param {RoomInfo} value
             */
            [STORE_MUTATION_TYPES.ADD_ROOM]: (state, value) => {
                state.activeRooms = {
                    ...state.activeRooms,
                    [value.roomId]: value
                }
            },
            [STORE_MUTATION_TYPES.UPDATE_ROOM]: (state, value) => {
                const room = state.activeRooms[value.roomId]
                state.activeRooms = {
                    ...state.activeRooms,
                    [value.roomId]: {
                        ...room,
                        ...value
                    }
                }
            },
            [STORE_MUTATION_TYPES.REMOVE_ROOM]: (state, value) => {
                const activeRoomsCopy = {...state.activeRooms};
                delete activeRoomsCopy[value];

                state.activeRooms = {
                    ...activeRoomsCopy,
                }
            },
            [STORE_MUTATION_TYPES.SET_CURRENT_ACTIVE_ROOM_ID]: (state, value) => {
                state.currentActiveRoomId = value;
            },
            [STORE_MUTATION_TYPES.SET_SIP_DOMAIN]: (state, value) => {
                state.sipDomain = value
            },
            [STORE_MUTATION_TYPES.SET_SIP_OPTIONS]: (state, value) => {
                state.sipOptions = value
            }
        },
        getters: {
            getActiveRooms: state => state.activeRooms,
            getActiveCalls: state => state.activeCalls,
            getActiveCallsList: state => Object.values(state.activeCalls),
            _uaInit: state => state.uaInit,
            getSipDomain: state => state.sipDomain,
            getSipOptions: (state, getters) => {
                return {
                    ...state.sipOptions,
                    mediaConstraints: getters.getUserMediaConstraints,
                }
            },
            getInputDeviceList: (state) => {
                return state.availableMediaDevices.filter(device => device.kind === 'audioinput');
            },
            getOutputDeviceList: (state) => {
                return state.availableMediaDevices.filter(device => device.kind === 'audiooutput');
            },
            getCurrentActiveRoomId: state => state.currentActiveRoomId,
            getSelectedInputDevice: state => state.selectedMediaDevices.input,
            getInputDefaultDevice: (state, getters) => {
                return getters.getInputDeviceList.find(device => device.id === 'default')
            },
            getOutputDefaultDevice: (state, getters) => {
                return getters.getOutputDeviceList.find(device => device.id === 'default')
            },
            getSelectedOutputDevice: state => state.selectedMediaDevices.output,
            getUserMediaConstraints: (state) => {
                return {
                    audio: {
                        deviceId: {
                            exact: state.selectedMediaDevices.input
                        }
                    },
                    video: false
                }
            },
            getListeners: state => state.listeners,
            callAddingInProgress: state => state.callAddingInProgress,
            isDND: state => state.isDND,
            isMuted: state => state.isMuted,
            metricConfig: state => state.metricConfig,
            originalStream: state => state.originalStream,
            microphoneInputLevel: state => state.microphoneInputLevel,
            speakerVolume: state => state.speakerVolume,
            callStatus: state => state.callStatus,
            callTime: state => state.callTime,
            callMetrics: state => state.callMetrics,
            muteWhenJoin: state => state.muteWhenJoin
        },
        actions: {
            async _addCall({commit, getters, dispatch}, session) {
                if (Object.keys(getters.getActiveCalls).find(activeSession => activeSession._id === session._id) !== undefined) {
                    return;
                }

                const roomId = getNewRoomId(getters.getActiveRooms);
                const newRoomInfo = {
                    started: new Date(),
                    incomingInProgress: false,
                    roomId
                };

                if (session.direction === CONSTRAINTS.CALL_DIRECTION_INCOMING) {
                    newRoomInfo["incomingInProgress"] = true;

                    dispatch('subscribe', {type: CALL_EVENT_LISTENER_TYPE.CALL_CONFIRMED, listener: (call) => {
                            if (session._id === call._id) {
                                commit(STORE_MUTATION_TYPES.UPDATE_ROOM, {
                                    incomingInProgress: false,
                                    roomId
                                });
                                dispatch('_startCallTimer', session._id);
                            }
                        }})

                    dispatch('subscribe', {type: CALL_EVENT_LISTENER_TYPE.CALL_FAILED, listener: (call) => {
                            if (session._id === call._id) {
                                commit(STORE_MUTATION_TYPES.UPDATE_ROOM, {
                                    incomingInProgress: false,
                                    roomId
                                });
                            }
                        }})
                } else if (session.direction === CONSTRAINTS.CALL_DIRECTION_OUTGOING) {
                    dispatch('_startCallTimer', session._id);
                }

                session.roomId = roomId;
                session.localMuted = false;
                commit(STORE_MUTATION_TYPES.ADD_CALL, session);
                commit(STORE_MUTATION_TYPES.ADD_CALL_STATUS, session._id);
                commit(STORE_MUTATION_TYPES.ADD_ROOM, newRoomInfo);
            },
            _startCallTimer({commit, getters}, callId) {
                const timeData = {
                    callId,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    formatted: ''
                }
                commit(STORE_MUTATION_TYPES.SET_CALL_TIME, timeData);

                const interval = setInterval(() => {
                    const callTime = { ...getters.callTime[callId] };
                    const updatedTime = setupTime(callTime)
                    commit(STORE_MUTATION_TYPES.SET_CALL_TIME, { callId, ...updatedTime });
                }, 1000)

                commit(STORE_MUTATION_TYPES.SET_TIME_INTERVAL, { callId, interval });
            },
            _stopCallTimer({commit, getters}, callId) {
                commit(STORE_MUTATION_TYPES.REMOVE_TIME_INTERVAL, callId);
                commit(STORE_MUTATION_TYPES.REMOVE_CALL_TIME, callId);
            },
            _activeCallListRemove({commit, dispatch}, {_id}) {
                const callRoomIdToConfigure = activeCalls[_id].roomId;
                commit(STORE_MUTATION_TYPES.REMOVE_CALL, _id);

                dispatch('_roomReconfigure', callRoomIdToConfigure);
            },
            _deleteRoomIfEmpty({commit, getters}, roomId) {
                if (Object.values(activeCalls).filter(call => call.roomId === roomId).length === 0) {
                    commit(STORE_MUTATION_TYPES.REMOVE_ROOM, roomId)

                    if (getters.getCurrentActiveRoomId === roomId) {
                        commit(STORE_MUTATION_TYPES.SET_CURRENT_ACTIVE_ROOM_ID, roomId);
                    }
                }
            },
            doMute({commit, dispatch, getters}, muted) {
                const activeRoomId = getters.getCurrentActiveRoomId
                commit(STORE_MUTATION_TYPES.SET_MUTED, muted);
                dispatch('_roomReconfigure', activeRoomId)
            },
            _muteReconfigure({getters}, call) {
                if (getters.isMuted) {
                    call.mute({audio: true})
                } else {
                    call.unmute({audio: true})
                }
            },
            _setOriginalStream({commit}, stream) {
                commit(STORE_MUTATION_TYPES.SET_ORIGINAL_STREAM, stream);
            },
            setMuteWhenJoin({commit}, value) {
                commit(STORE_MUTATION_TYPES.SET_MUTED_WHEN_JOIN, value);
            },
            setMicrophoneInputLevel({dispatch, commit, getters}, value) {
                commit(STORE_MUTATION_TYPES.SET_MICROPHONE_INPUT_LEVEL, value);
                dispatch('_roomReconfigure', getters.getCurrentActiveRoomId)
            },
            setSpeakerVolume({commit, getters}, value) {
                commit(STORE_MUTATION_TYPES.SET_SPEAKER_VOLUME, value);
                Object.values(activeCalls).forEach((call) => {
                    call.audioTag.volume = getters.speakerVolume
                })
            },
            muteCaller({commit, getters, dispatch}, {callId, value}) {
                const call = activeCalls[callId];

                if (call && call.connection.getReceivers().length) {
                    call.localMuted = value
                    call.connection.getReceivers().forEach(receiver => {
                        receiver.track.enabled = !value
                    });
                    commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                    dispatch('_roomReconfigure', call.roomId)
                }
            },
            async _roomReconfigure({commit, getters, dispatch}, roomId) {
                if (!roomId) {
                    return;
                }

                const callsInRoom = Object.values(activeCalls).filter(call => call.roomId === roomId);

                // Lets take care on the audio output first and check if passed room is our selected room
                if (getters.getCurrentActiveRoomId === roomId) {
                    callsInRoom.forEach(call => {
                        if (call.audioTag) {
                            dispatch('_muteReconfigure', call);
                            call.audioTag.muted = false;
                            commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                        }
                    })
                } else {
                    callsInRoom.forEach(call => {
                        call.audioTag.muted = true;
                        commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                    });
                }

                // Now lets configure the sound we are sending for each active call on this room
                if (callsInRoom.length === 0) {
                    dispatch('_deleteRoomIfEmpty', roomId);
                } else if (callsInRoom.length === 1 && getters.getCurrentActiveRoomId !== roomId) {
                    if (!callsInRoom[0]._localHold) {
                        dispatch('doCallHold', {callId: callsInRoom[0]._id, toHold: true, automatic: true})
                    }
                } else if (callsInRoom.length === 1 && getters.getCurrentActiveRoomId === roomId) {
                    if (callsInRoom[0]._localHold && callsInRoom[0]._automaticHold) {
                        dispatch('doCallHold', {callId: callsInRoom[0]._id, toHold: false})
                    }

                    let stream;

                    try {
                        stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                    } catch (err) {
                        console.error(err)
                    }
                    if (callsInRoom[0].connection && callsInRoom[0].connection.getSenders()[0]) {
                        const processedStream = processAudioVolume(stream, getters.microphoneInputLevel)
                        processedStream.getTracks().forEach(track => track.enabled = !getters.isMuted)
                        dispatch('_setOriginalStream', processedStream);
                        await callsInRoom[0].connection.getSenders()[0].replaceTrack(processedStream.getTracks()[0]);
                        dispatch('_muteReconfigure', callsInRoom[0]);
                    }
                } else if (callsInRoom.length > 1) {
                    await dispatch('_doConference', callsInRoom);
                }
            },
            async _doConference({dispatch, getters}, sessions) {
                sessions.forEach(call => {
                    if (call._localHold) {
                        dispatch('doCallHold', {callId: call._id, toHold: false})
                    }
                });

                // Take all received tracks from the sessions you want to merge
                let receivedTracks = [];

                sessions.forEach(session => {
                    if (session !== null && session !== undefined) {
                        session.connection.getReceivers().forEach(receiver => {
                            receivedTracks.push(receiver.track);
                        });
                    }
                });

                // Use the Web Audio API to mix the received tracks
                const audioContext = new AudioContext();
                const allReceivedMediaStreams = new MediaStream();

                // For each call we will build dedicated mix for all other calls
                await forEach(sessions, async session => {
                    if (session === null || session === undefined) {
                        return
                    }

                    const mixedOutput = audioContext.createMediaStreamDestination();

                    session.connection.getReceivers().forEach(receiver => {
                        receivedTracks.forEach(track => {
                            allReceivedMediaStreams.addTrack(receiver.track);

                            if (receiver.track.id !== track.id) {
                                let sourceStream = audioContext.createMediaStreamSource(new MediaStream([track]));

                                sourceStream.connect(mixedOutput);
                            }
                        });
                    });

                    if (sessions[0].roomId === getters.getCurrentActiveRoomId) {
                        // Mixing your voice with all the received audio
                        const stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                        const processedStream = processAudioVolume(stream, getters.microphoneInputLevel)
                        processedStream.getTracks().forEach(track => track.enabled = !getters.isMuted);
                        dispatch('_setOriginalStream', processedStream);
                        const sourceStream = audioContext.createMediaStreamSource(processedStream);

                        // stream.getTracks().forEach(track => track.enabled = !getters.isMuted) // TODO: Fix this

                        sourceStream.connect(mixedOutput);
                    }

                    if (session.connection.getSenders()[0]) {
                        //mixedOutput.stream.getTracks().forEach(track => track.enabled = !getters.isMuted) // Uncomment to mute all callers on mute
                        await session.connection.getSenders()[0].replaceTrack(mixedOutput.stream.getTracks()[0]);
                        dispatch('_muteReconfigure', session);
                    }
                });
            },
            _triggerListener({getters}, {listenerType, session, event}) {
                const listeners = getters.getListeners[listenerType];

                if (!listeners || !listeners.length) {
                    return
                }

                listeners.forEach((listener) => {
                    listener(session, event);
                });
            },
            _cancelAllOutgoingUnanswered({getters, dispatch}) {
                getters.getActiveCallsList.filter(call => {
                    return call.direction === CONSTRAINTS.CALL_DIRECTION_OUTGOING
                        && call.status === CONSTRAINTS.CALL_STATUS_UNANSWERED
                }).forEach(call => dispatch('callTerminate', call._id));
            },
            async updateDeviceList({commit, dispatch, getters}) {
                await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                const devices = await navigator.mediaDevices.enumerateDevices();

                commit(STORE_MUTATION_TYPES.SET_MEDIA_DEVICES, devices);
            },
            async setMediaDevices({commit, dispatch, getters}, setDefaults = false) {
                await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                const devices = await navigator.mediaDevices.enumerateDevices();

                commit(STORE_MUTATION_TYPES.SET_MEDIA_DEVICES, devices);

                const defaultMicrophone = setDefaults
                    ? getters.getInputDefaultDevice.id
                    : ''
                const defaultSpeaker = setDefaults
                    ? getters.getOutputDefaultDevice.id
                    : ''

                dispatch('setMicrophone', defaultMicrophone);
                dispatch('setSpeaker', defaultSpeaker);

                navigator.mediaDevices.addEventListener(
                    'devicechange',
                    () => {
                        dispatch('updateDeviceList')
                    }
                )
            },
            async setMicrophone({commit, getters, dispatch}, dId) {
                if (!getters.getInputDeviceList.find(({deviceId}) => deviceId === dId)) {
                    return
                }

                commit(STORE_MUTATION_TYPES.SET_SELECTED_INPUT_DEVICE, dId);

                let stream = null;

                try {
                    stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                } catch (err) {
                    console.error(err);
                }

                if (Object.keys(getters.getActiveCalls).length === 0) {
                    return;
                }

                const callsInCurrentRoom = Object.values(activeCalls).filter(call => call.roomId === getters.getCurrentActiveRoomId);

                if (callsInCurrentRoom.length === 1) {
                    Object.values(callsInCurrentRoom).forEach(call => {
                        const processedStream = processAudioVolume(stream, getters.microphoneInputLevel)
                        processedStream.getTracks().forEach(track => track.enabled = !getters.isMuted)
                        dispatch('_setOriginalStream', processedStream);
                        call.connection.getSenders()[0].replaceTrack(processedStream.getTracks()[0]);
                        //dispatch('_muteReconfigure', call);
                        commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                    });
                } else {
                    await dispatch('_doConference', callsInCurrentRoom);
                }
            },
            async setSpeaker({commit, getters, dispatch}, dId) {
                if (!getters.getOutputDeviceList.find(({deviceId}) => deviceId === dId)) {
                    return
                }

                commit(STORE_MUTATION_TYPES.SET_SELECTED_OUTPUT_DEVICE, dId);

                const activeCallList = Object.values(activeCalls);

                if (activeCallList.length === 0) {
                    return;
                }

                const callsInCurrentRoom = activeCallList.filter(call => call.roomId === getters.getCurrentActiveRoomId);

                if (callsInCurrentRoom.length === 1) {
                    activeCallList.forEach(call => {
                        call.audioTag.setSinkId(dId);
                        commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                    });
                } else {
                    await dispatch('_doConference', callsInCurrentRoom);
                }
            },
            async setCurrentActiveRoom({commit, getters, dispatch}, roomId) {
                const oldRoomId = getters.getCurrentActiveRoomId;

                if (roomId === oldRoomId) {
                    return;
                }

                commit(STORE_MUTATION_TYPES.SET_CURRENT_ACTIVE_ROOM_ID, roomId);

                await dispatch('_roomReconfigure', oldRoomId)
                await dispatch('_roomReconfigure', roomId)
            },
            setDND({commit}, value) {
                commit(STORE_MUTATION_TYPES.SET_DND, value);
            },
            doCallHold({commit}, {callId, toHold, automatic}) {
                const call = activeCalls[callId];
                call._automaticHold = automatic || false;

                if (toHold) {
                    call.hold();
                } else {
                    call.unhold();
                }

                commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
            },
            async _triggerAddStream({dispatch, getters, commit}, {event, call}) {
                commit(STORE_MUTATION_TYPES.SET_MUTED, getters.muteWhenJoin);

                const stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                const processedStream = processAudioVolume(stream, getters.microphoneInputLevel)
                const muteMicro = getters.isMuted || getters.muteWhenJoin

                processedStream.getTracks().forEach(track => track.enabled = !muteMicro)
                dispatch('_setOriginalStream', processedStream);
                await call.connection.getSenders()[0].replaceTrack(processedStream.getTracks()[0]);
                //dispatch('_muteReconfigure', call);

                syncStream(event, call, getters.getSelectedOutputDevice, getters.speakerVolume);
                dispatch('_getCallQuality', call);
                commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
            },
            doCall({dispatch, getters, commit}, {target, addToCurrentRoom = false}) {
                const activeRoomId = getters.getCurrentActiveRoomId

                if (!getters._uaInit) {
                    return console.error('Run init action first');
                }

                if (target.toString().length === 0) {
                    return console.error('Target must be passed');
                }

                const call = UA.call(`sip:${target}@${getters.getSipDomain}`, getters.getSipOptions);
                commit(STORE_MUTATION_TYPES.CALL_ADDING_IN_PROGRESS, call._id);

                if (addToCurrentRoom && activeRoomId) {
                    dispatch('callChangeRoom', {callId: call._id, roomId: activeRoomId})
                }

                call.connection.addEventListener('addstream', async event => {
                    dispatch('_triggerAddStream', {event, call});
                })
            },
            callTerminate(context, callId) {
                const call = activeCalls[callId];

                if (call._status !== 8) {
                    call.terminate();
                }
            },
            callTransfer({commit, getters}, {callId, target}) {
                if (target.toString().length === 0) {
                    return console.error('Target must be passed');
                }

                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId, isTransferring: true });

                const call = activeCalls[callId];

                call.refer(`sip:${target}@${getters.getSipDomain}`);
                commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
            },
            callMerge({commit}, roomId) {
                const callsInRoom = Object.values(activeCalls).filter((call) => call.roomId === roomId)
                if (callsInRoom.length !== 2) return

                const firstCall = callsInRoom[0]
                const secondCall = callsInRoom[1]

                if (!firstCall || !secondCall) {
                    return
                }

                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId: firstCall._id, isMerging: true });
                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId: secondCall._id, isMerging: true });

                firstCall.refer(secondCall.remote_identity._uri.toString(), {'replaces': secondCall});
                commit(STORE_MUTATION_TYPES.UPDATE_CALL, firstCall);
            },
            callMergeByIds({commit}, {firstCallId, secondCallId}) {
                const firstCall = Object.values(activeCalls).find((call) => call._id === firstCallId)
                const secondCall = Object.values(activeCalls).find((call) => call._id === secondCallId)

                if (!firstCall || !secondCall) {
                    return
                }

                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId: firstCall._id, isMerging: true });
                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId: secondCall._id, isMerging: true });

                firstCall.refer(secondCall.remote_identity._uri.toString(), {'replaces': secondCall});
                commit(STORE_MUTATION_TYPES.UPDATE_CALL, firstCall);
            },
            async callMove({dispatch, commit}, {callId, roomId}) {
                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId, isMoving: true });
                await dispatch('callChangeRoom', {callId, roomId})
                commit(STORE_MUTATION_TYPES.UPDATE_CALL_STATUS, { callId, isMoving: false });
            },
            sendDTMF({dispatch, commit}, {callId, value}) {
                const validation_regex = /^[A-D0-9#*]+$/g
                if (!validation_regex.test(value)) {
                    throw new Error('Not allowed character in DTMF input')
                }
                const call = activeCalls[callId];
                call.sendDTMF(value);
            },
            callAnswer({commit, getters, dispatch}, callId) {
                const call = activeCalls[callId];

                dispatch('_cancelAllOutgoingUnanswered');
                call.answer(getters.getSipOptions);
                commit(STORE_MUTATION_TYPES.UPDATE_CALL, call);
                dispatch('setCurrentActiveRoom', call.roomId); //TODO: move to top

                call.connection.addEventListener('addstream', async event => {
                    dispatch('_triggerAddStream', {event, call});
                });
            },
            _getCallQuality({dispatch, commit, getters}, call) {
                const metrics = new WebRTCMetrics(getters.metricConfig);
                const probe = metrics.createProbe(call.connection, {
                    cid: call._id
                });

                let inboundKeys = []
                let inboundAudio
                probe.onreport = (probe) => {
                    //console.log('probe', probe)
                    const inboundMetrics = Object.entries(probe.audio).filter(([key, value]) => {
                        return value.direction === "inbound"
                    })
                    inboundMetrics.forEach(([key, value]) => {
                        if (!inboundKeys.includes(key)) {
                            inboundKeys.push(key)
                            inboundAudio = key
                        }
                    });

                    const inboundAudioMetric = probe.audio[inboundAudio]
                    const metrics = filterObjectkeys(inboundAudioMetric, METRIC_KEYS_TO_INCLUDE)
                    metrics.callId = call._id
                    commit(STORE_MUTATION_TYPES.SET_CALL_METRICS, metrics);
                };

                dispatch('subscribe', {type: CALL_EVENT_LISTENER_TYPE.CALL_ENDED, listener: (session) => {
                    if (session._id === call._id) {
                        metrics.stopAllProbes();
                    }
                }})

                metrics.startAllProbes();
            },
            async callChangeRoom({dispatch}, {callId, roomId}) {
                const oldRoomId = activeCalls[callId].roomId;

                activeCalls[callId].roomId = roomId;

                await dispatch('setCurrentActiveRoom', roomId);

                return Promise.all([
                    dispatch('_roomReconfigure', oldRoomId),
                    dispatch('_roomReconfigure', roomId)
                ]).then(() => {
                    dispatch('_deleteRoomIfEmpty', oldRoomId);
                    dispatch('_deleteRoomIfEmpty', roomId);
                })
            },
            subscribe({commit}, value) {
                commit(STORE_MUTATION_TYPES.ADD_LISTENER, value)
            },
            removeListener({commit}, type) {
                commit(STORE_MUTATION_TYPES.REMOVE_LISTENER, type)
            },
            init({commit, dispatch, getters}, {configuration, socketInterfaces, listeners = [], sipDomain, sipOptions}) {
                // freeswitch sip expirse 不低于120
                JsSIP.C.SESSION_EXPIRES = 120;
                JsSIP.C.MIN_SESSION_EXPIRES = 120;
                
                configuration.sockets = socketInterfaces.map(sock => new JsSIP.WebSocketInterface(sock))
                
                UA = new JsSIP.UA(configuration);
                UA.start();
                listeners.push({
                    name: 'newRTCSession',
                    cb: ({session}) => {
                        if (getters.isDND) {
                            session.terminate({status_code: 486, reason_phrase: "Do Not Disturb"})
                            return
                        }

                        // stop timers on ended and failed

                        session._events.ended = function (event) {
                            dispatch('_triggerListener', {listenerType: CALL_EVENT_LISTENER_TYPE.CALL_ENDED, session, event});
                            dispatch('_activeCallListRemove', session);
                            dispatch('_stopCallTimer', session._id);
                            commit(STORE_MUTATION_TYPES.REMOVE_CALL_STATUS, session._id);
                            commit(STORE_MUTATION_TYPES.REMOVE_CALL_METRICS, session._id);

                            if (!Object.keys(activeCalls).length) {
                                commit(STORE_MUTATION_TYPES.SET_MUTED, false);
                            }
                        };
                        session._events.progress = function (event) {
                            dispatch('_triggerListener', {listenerType: CALL_EVENT_LISTENER_TYPE.CALL_PROGRESS, session, event});
                        };
                        session._events.failed = function (event) {
                            dispatch('_triggerListener', {listenerType: CALL_EVENT_LISTENER_TYPE.CALL_FAILED, session, event});

                            if (session._id === getters.callAddingInProgress) {
                                commit(STORE_MUTATION_TYPES.CALL_ADDING_IN_PROGRESS, null);
                            }

                            dispatch('_activeCallListRemove', session);
                            dispatch('_stopCallTimer', session._id);
                            commit(STORE_MUTATION_TYPES.REMOVE_CALL_STATUS, session._id);
                            commit(STORE_MUTATION_TYPES.REMOVE_CALL_METRICS, session._id);

                            if (!Object.keys(activeCalls).length) {
                                commit(STORE_MUTATION_TYPES.SET_MUTED, false);
                            }
                        };
                        session._events.confirmed = function (event) {
                            dispatch('_triggerListener', {listenerType: CALL_EVENT_LISTENER_TYPE.CALL_CONFIRMED, session, event});
                            commit(STORE_MUTATION_TYPES.UPDATE_CALL, session);

                            if (session._id === getters.callAddingInProgress) {
                                commit(STORE_MUTATION_TYPES.CALL_ADDING_IN_PROGRESS, null);
                            }
                        };

                        dispatch('_triggerListener', {listenerType: CALL_EVENT_LISTENER_TYPE.NEW_CALL, session});
                        dispatch('_addCall', session);

                        if (session.direction === CONSTRAINTS.CALL_DIRECTION_OUTGOING) {
                            dispatch('setCurrentActiveRoom', session.roomId);
                        }
                    }
                });

                listeners.forEach(({name, cb}) => UA.on(name, cb));

                commit(STORE_MUTATION_TYPES.SET_SIP_DOMAIN, sipDomain);
                commit(STORE_MUTATION_TYPES.SET_SIP_OPTIONS, sipOptions);
                commit(STORE_MUTATION_TYPES.SET_UA_INIT);
            },
            setMetricConfig({commit}, config) {
                commit(STORE_MUTATION_TYPES.SET_METRIC_CONFIG, config);
            },
        }
    });
}

export default {
    /**
     * @param {Object} Vue
     * @param {VSIPOptions} options
     */
    install(Vue, options) {
        initStoreModule(options);
    },
    STORAGE_KEYS,
    STORE_MUTATION_TYPES,
    CALL_EVENT_LISTENER_TYPE,
    CONSTRAINTS,
    CALL_KEYS_TO_INCLUDE
}
