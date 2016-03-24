import { updateQueue } from './Component'


const TRUE = true

// event config
export const notBubbleEvents = {
    onmouseleave: TRUE,
    onmouseenter: TRUE,
    onload: TRUE,
    onunload: TRUE,
    onscroll: TRUE,
    onfocus: TRUE,
    onblur: TRUE,
    onrowexit: TRUE,
    onbeforeunload: TRUE,
    onstop: TRUE,
    ondragdrop: TRUE,
    ondragenter: TRUE,
    ondragexit: TRUE,
    ondraggesture: TRUE,
    ondragover: TRUE,
    oncontextmenu: TRUE
}

export function getEventName(key) {
	key = key === 'onDoubleClick' ? 'ondblclick' : key
	return key.toLowerCase()
}

let eventTypes = {}
export function addEvent(elem, eventType, listener) {
	eventType = getEventName(eventType)

	if (notBubbleEvents[eventType] === TRUE) {
		elem[eventType] = listener
		return
	}

	let eventStore = elem.eventStore || (elem.eventStore = {})
	eventStore[eventType] = listener

	if (!eventTypes[eventType]) {
		// onclick -> click
		document.addEventListener(eventType.substr(2), dispatchEvent)
		eventTypes[eventType] = true
	}

	let nodeName = elem.nodeName

	if (eventType === 'onchange' && (nodeName === 'INPUT' || nodeName === 'TEXTAREA')) {
		addEvent(elem, 'oninput', listener)
	}
}

export function removeEvent(elem, eventType) {
	eventType = getEventName(eventType)
	if (notBubbleEvents[eventType] === TRUE) {
		elem[eventType] = null
		return
	}

	let eventStore = elem.eventStore || (elem.eventStore = {})
	delete eventStore[eventType]

	let nodeName = elem.nodeName

	if (eventType === 'onchange' && (nodeName === 'INPUT' || nodeName === 'TEXTAREA')) {
		delete eventStore['oninput']
	}
}

function dispatchEvent(event) {
	let { target, type } = event
	let eventType = 'on' + type
	let syntheticEvent
	updateQueue.isPending = true
	while (target) {
		let { eventStore } = target
		let listener = eventStore && eventStore[eventType]
		if (!listener) {
			target = target.parentNode
			continue
		}
		if (!syntheticEvent) {
			syntheticEvent = createSyntheticEvent(event)
		}
		syntheticEvent.currentTarget = target
		listener.call(target, syntheticEvent)
		if (syntheticEvent.$cancalBubble) {
			break
		}
		target = target.parentNode
	}
	updateQueue.isPending = false
	updateQueue.batchUpdate()
}


function createSyntheticEvent(nativeEvent) {
    let syntheticEvent = {}
    let cancalBubble = () => syntheticEvent.$cancalBubble = true
    syntheticEvent.nativeEvent = nativeEvent
    for (let key in nativeEvent) {
    	if (typeof nativeEvent[key] !== 'function') {
    		syntheticEvent[key] = nativeEvent[key]
    	} else if (key === 'stopPropagation' || key === 'stopImmediatePropagation') {
    		syntheticEvent[key] = cancalBubble
    	} else {
    		syntheticEvent[key] = nativeEvent[key].bind(nativeEvent)
    	}
    }
    return syntheticEvent
}
