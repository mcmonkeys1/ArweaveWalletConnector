type EventType = 'step' | 'error'



function hook (_this: any, method: any, callback: any) {
	const orig = _this[method]
	return (...args: any[]) => {
		callback.apply(null, args)
		return orig.apply(_this, args)
	}
}

function doNotTrack () {
	const { doNotTrack, navigator, external } = window as any
	const msTrackProtection = 'msTrackingProtectionEnabled'
	const msTracking = () => external && msTrackProtection in external && external[msTrackProtection]()
	const dnt = doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack || msTracking()
	return dnt == '1' || dnt === 'yes'
}

const isMain = location.hostname === 'jfbeats.github.io'
const isLocalhost = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*:)*?:?0*1$/.test(location.hostname) || location.protocol === 'file:'
const isKnown = isMain || isLocalhost



function init () {
	const {
		screen: { width, height },
		navigator: { language },
		location: { hostname, pathname, search },
		localStorage,
		document,
		history,
	} = window
	
	const root = 'https://an.arweave.duckdns.org'
	const website = isMain ? 'b379cbc5-73ed-4168-8331-5d41f0a88e3d'
			: isLocalhost ? '59437916-9c3e-4945-a25c-9a1ccdf520a9'
			: '8a399a1f-dbce-4ceb-b1d7-6882f50a55b9'
	const dnt = false
	
	const screen = `${width}x${height}`
	let currentUrl = isKnown ? `${pathname}${search}` : location.href
	let currentRef = document.referrer
	let cache: string
	
	const post = (url: string, data: object, callback: Function) => {
		const req = new XMLHttpRequest()
		req.open('POST', url, true)
		req.setRequestHeader('Content-Type', 'application/json')
		if (cache) req.setRequestHeader('x-umami-cache', cache)
		req.onreadystatechange = () => req.readyState === 4 && callback(req.response)
		req.send(JSON.stringify(data))
	}
	
	const trackingDisabled = () => localStorage && localStorage.getItem('umami.disabled') || dnt && doNotTrack()
	const collect = (type: string, payload: object) => {
		if (trackingDisabled()) { return }
		post(`${root}/api/collect`, { type, payload }, (res: string) => { cache = res })
	}
	
	const getPayload = () => ({ website, hostname, screen, language, url: currentUrl })
	const view = () => collect('pageview', Object.assign(getPayload(), { referrer: currentRef }))
	const event = (event_type: EventType, event_value: string) => collect('event', Object.assign(getPayload(), { event_type, event_value }))
	
	const handlePush = (state: any, title: any, url: any) => {
		if (!url) { return }
		currentRef = currentUrl
		const newUrl = url.toString()
		currentUrl = newUrl.substring(0, 4) === 'http' && isKnown ? '/' + newUrl.split('/').splice(3).join('/') : newUrl
		if (currentUrl !== currentRef) { view() }
	}
	
	if (!trackingDisabled()) {
		// history.pushState = hook(history, 'pushState', handlePush)
		// history.replaceState = hook(history, 'replaceState', handlePush)
		const update = () => document.readyState === 'complete' && view()
		document.addEventListener('readystatechange', update, true)
		update()
	}
	
	
	
	return { event }
}

export const track = init()