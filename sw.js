const CACHE = "ncode-manager-v1.3";

const FILES = [

    "./",
    "./index.html",
    "./style.css",
    "./friendly.css",
    "./script.js",
    "./friendly.js",
    "./animations.js",
    "./listino.js",
    "./storage.js",
    "./manifest.json",
    "./assets/icon-192.png",
    "./assets/icon-512.png"

];

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE)

            .then(cache => cache.addAll(FILES))

            .then(() => self.skipWaiting())

    );

});

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()

            .then(keys => Promise.all(

                keys.filter(key =>

                    key.startsWith("ncode-manager-") &&
                    key !== CACHE

                ).map(key => caches.delete(key))

            ))

            .then(() => self.clients.claim())

    );

});

self.addEventListener("fetch", event => {

    const request = event.request;
    const url = new URL(request.url);

    if (

        request.method !== "GET" ||
        url.origin !== self.location.origin ||
        url.pathname.startsWith("/cdn-cgi/")

    ) {
        return;
    }

    event.respondWith(

        fetch(request)

            .then(response => {

                if (

                    response.ok &&
                    !response.redirected &&
                    response.type === "basic"

                ) {

                    const copy = response.clone();

                    event.waitUntil(

                        caches.open(CACHE)

                            .then(cache =>

                                cache.put(request, copy)

                            )

                    );

                }

                return response;

            })

            .catch(async () => {

                const cached = await caches.match(request);

                if (cached) {
                    return cached;
                }

                if (request.mode === "navigate") {

                    return (

                        await caches.match("./index.html") ||
                        Response.error()

                    );

                }

                return Response.error();

            })

    );

});