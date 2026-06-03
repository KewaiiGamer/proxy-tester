export namespace app {
	
	export class TestDomain {
	    url: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new TestDomain(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.name = source["name"];
	    }
	}
	export class AppSettings {
	    domains: TestDomain[];
	    default_timeout: number;
	    default_threads: number;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domains = this.convertValues(source["domains"], TestDomain);
	        this.default_timeout = source["default_timeout"];
	        this.default_threads = source["default_threads"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Proxy {
	    id: number;
	    user: string;
	    password: string;
	    host: string;
	    port: number;
	    alive?: boolean;
	    latency?: number;
	    last_error?: string;
	    // Go type: time
	    last_test?: any;
	
	    static createFrom(source: any = {}) {
	        return new Proxy(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.user = source["user"];
	        this.password = source["password"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.alive = source["alive"];
	        this.latency = source["latency"];
	        this.last_error = source["last_error"];
	        this.last_test = this.convertValues(source["last_test"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProxyList {
	    name: string;
	    proxies: Proxy[];
	    // Go type: time
	    created: any;
	    // Go type: time
	    updated: any;
	
	    static createFrom(source: any = {}) {
	        return new ProxyList(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.proxies = this.convertValues(source["proxies"], Proxy);
	        this.created = this.convertValues(source["created"], null);
	        this.updated = this.convertValues(source["updated"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TestProgress {
	    total: number;
	    completed: number;
	    alive: number;
	    dead: number;
	    current_index: number;
	
	    static createFrom(source: any = {}) {
	        return new TestProgress(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.completed = source["completed"];
	        this.alive = source["alive"];
	        this.dead = source["dead"];
	        this.current_index = source["current_index"];
	    }
	}
	export class TestResult {
	    total: number;
	    alive: number;
	    dead: number;
	    proxies: Proxy[];
	    duration: string;
	
	    static createFrom(source: any = {}) {
	        return new TestResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.alive = source["alive"];
	        this.dead = source["dead"];
	        this.proxies = this.convertValues(source["proxies"], Proxy);
	        this.duration = source["duration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

