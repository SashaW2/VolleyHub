import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button/Button';
import styles from './NearestMapModal.module.css';

const YANDEX_MAPS_API_KEY = process.env.REACT_APP_YANDEX_MAPS_API_KEY;

const loadYandexMaps = () => {
    return new Promise((resolve) => {
        if (window.ymaps) {
            window.ymaps.ready(resolve);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${YANDEX_MAPS_API_KEY ? `&apikey=${YANDEX_MAPS_API_KEY}` : ''}`;
        script.async = true;
        script.onload = () => {
            window.ymaps.ready(resolve);
        };
        document.head.appendChild(script);
    });
};

const createNumberedIcon = (label) => {
    const text = String(label);
    const fontSize = text.length > 2 ? 13 : 16;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">` +
        `<circle cx="18" cy="18" r="16" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>` +
        `<text x="18" y="${fontSize === 13 ? 22.5 : 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${text}</text>` +
        `</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getAdvertGroups = (adverts) => {
    const groups = new Map();

    adverts.forEach((advert, index) => {
        if (!advert._coords) return;
        const key = `${advert._coords.lat.toFixed(5)},${advert._coords.lon.toFixed(5)}`;
        if (!groups.has(key)) {
            groups.set(key, { coords: advert._coords, items: [] });
        }
        groups.get(key).items.push({ advert, index });
    });

    return Array.from(groups.values());
};

const getCoordsSignature = (adverts) => {
    const keys = adverts
        .filter((advert) => advert && advert._coords)
        .map((advert) => `${advert._coords.lat.toFixed(5)},${advert._coords.lon.toFixed(5)}`);
    keys.sort();
    return keys.join('|');
};

const NearestMapModal = ({ isOpen, onClose, adverts, userCoords, userAddress, onViewAdvert }) => {
    const { t } = useLanguage();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const advertLayerRef = useRef(null);
    const pendingBoundsRef = useRef(null);
    const coordsSignatureRef = useRef(null);
    const advertsRef = useRef(adverts);
    const userCoordsRef = useRef(userCoords);
    const userAddressRef = useRef(userAddress);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        advertsRef.current = adverts;
    }, [adverts]);

    useEffect(() => {
        userCoordsRef.current = userCoords;
    }, [userCoords]);

    useEffect(() => {
        userAddressRef.current = userAddress;
    }, [userAddress]);

    const renderAdvertPlacemarks = useCallback((advertsList) => {
        const layer = advertLayerRef.current;
        if (!layer) return;

        layer.removeAll();

        getAdvertGroups(advertsList).forEach((group) => {
            const tops = group.items.map((item) => item.index + 1);
            const label = tops.length > 1
                ? `${tops[0]}-${tops[tops.length - 1]}`
                : String(tops[0]);
            const address = group.items[0].advert.address;
            const distanceKm = group.items[0].advert._distance != null
                ? group.items[0].advert._distance.toFixed(2)
                : null;

            const links = group.items.map(({ advert, index }) => `
                <div style="margin-top: 6px;">
                    <span style="font-weight: 600;">${t('mapTop')} ${index + 1}</span> -
                    <a href="/advert/${advert.id}" style="color: #667eea; font-weight: 600; text-decoration: none;">
                        ${t('mapViewAdvert')}
                    </a>
                </div>
            `).join('');

            const balloon = `
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${address}</div>
                    ${distanceKm ? `<div>${t('mapDistance')}: ${distanceKm} км</div>` : ''}
                    ${links}
                </div>
            `;

            layer.add(new window.ymaps.Placemark(
                [group.coords.lat, group.coords.lon],
                { hintContent: `${t('mapTop')} ${label}: ${address}`, balloonContent: balloon },
                {
                    iconLayout: 'default#image',
                    iconImageHref: createNumberedIcon(label),
                    iconImageSize: [36, 36],
                    iconImageOffset: [-18, -18]
                }
            ));
        });
    }, [t]);

    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
            advertLayerRef.current = null;
            coordsSignatureRef.current = null;
            return;
        }

        let cancelled = false;

        const init = async () => {
            setLoading(true);
            try {
                await loadYandexMaps();
                if (cancelled || !mapRef.current) return;

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.destroy();
                    mapInstanceRef.current = null;
                }

                const currentAdverts = advertsRef.current || [];
                const currentUserCoords = userCoordsRef.current;
                const currentUserAddress = userAddressRef.current;

                const center = currentUserCoords
                    ? [currentUserCoords.lat, currentUserCoords.lon]
                    : (currentAdverts[0]?._coords ? [currentAdverts[0]._coords.lat, currentAdverts[0]._coords.lon] : [53.9, 27.5667]);

                const map = new window.ymaps.Map(mapRef.current, {
                    center,
                    zoom: 12,
                    controls: ['zoomControl', 'fullscreenControl']
                });

                mapInstanceRef.current = map;

                if (currentUserCoords) {
                    const youAreHere = currentUserAddress
                        ? `${t('mapYouAreHere')}: ${currentUserAddress}`
                        : t('mapYouAreHere');
                    map.geoObjects.add(new window.ymaps.Placemark(
                        [currentUserCoords.lat, currentUserCoords.lon],
                        { hintContent: youAreHere, balloonContent: youAreHere },
                        { preset: 'islands#blueHomeIcon' }
                    ));
                }

                const layer = new window.ymaps.GeoObjectCollection();
                map.geoObjects.add(layer);
                advertLayerRef.current = layer;

                renderAdvertPlacemarks(currentAdverts);
                coordsSignatureRef.current = getCoordsSignature(currentAdverts);

                if (currentAdverts.length > 0) {
                    pendingBoundsRef.current = map.geoObjects.getBounds();
                }
            } catch (e) {
                console.error('Map init error:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        init();

        return () => {
            cancelled = true;
            pendingBoundsRef.current = null;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
            advertLayerRef.current = null;
        };
    }, [isOpen, t, renderAdvertPlacemarks]);

    useEffect(() => {
        if (!isOpen || loading) return;

        const map = mapInstanceRef.current;
        if (!map || !advertLayerRef.current) return;

        const previousSignature = coordsSignatureRef.current;
        renderAdvertPlacemarks(adverts);
        const nextSignature = getCoordsSignature(adverts);
        coordsSignatureRef.current = nextSignature;

        if (previousSignature !== null && previousSignature !== nextSignature && nextSignature !== '') {
            const bounds = advertLayerRef.current.getBounds();
            if (bounds) {
                map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
            }
        }
    }, [isOpen, loading, adverts, renderAdvertPlacemarks]);

    useEffect(() => {
        if (loading) return;

        const map = mapInstanceRef.current;
        const bounds = pendingBoundsRef.current;
        if (!map || !bounds) return;

        pendingBoundsRef.current = null;

        map.container.fitToViewport();
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
    }, [loading]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('mapNearestTitle')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div className={styles.content}>
                    {loading && <div className={styles.loading}>{t('mapLoading')}</div>}
                    <div ref={mapRef} className={styles.map} style={{ display: loading ? 'none' : 'block' }} />
                </div>
                <div className={styles.footer}>
                    <Button variant="outline" onClick={onClose}>{t('mapClose')}</Button>
                </div>
            </div>
        </div>
    );
};

export default NearestMapModal;