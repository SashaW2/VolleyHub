import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const AdvertStreamContext = createContext(null);

export const useAdvertStream = () => {
    const ctx = useContext(AdvertStreamContext);
    if (!ctx) {
        throw new Error('useAdvertStream must be used within AdvertStreamProvider');
    }
    return ctx;
};

export const AdvertStreamProvider = ({ children }) => {
    const [lastEvent, setLastEvent] = useState(null);
    const esRef = useRef(null);

    useEffect(() => {
        if (esRef.current || typeof window === 'undefined' || !window.EventSource) {
            return;
        }

        const es = new EventSource('/api/adverts/stream');
        esRef.current = es;

        es.addEventListener('adverts', (event) => {
            let payload = null;
            try {
                payload = JSON.parse(event.data);
            } catch (e) {
                payload = null;
            }
            setLastEvent({ ...(payload || {}), _receivedAt: Date.now() });
        });

        es.onerror = () => {
            // EventSource переподключится сам (retry задаётся сервером)
        };

        return () => {
            es.close();
            esRef.current = null;
        };
    }, []);

    return (
        <AdvertStreamContext.Provider value={{ lastEvent }}>
            {children}
        </AdvertStreamContext.Provider>
    );
};
