import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button/Button';
import styles from './NearestMapModal.module.css';

const loadYandexMaps = () => {
    return new Promise((resolve) => {
        if (window.ymaps) {
            window.ymaps.ready(resolve);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
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

const NearestMapModal = ({ isOpen, onClose, adverts, userCoords, userAddress, onViewAdvert }) => {
    const { t } = useLanguage();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const pendingBoundsRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
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

                const center = userCoords
                    ? [userCoords.lat, userCoords.lon]
                    : (adverts[0]?._coords ? [adverts[0]._coords.lat, adverts[0]._coords.lon] : [53.9, 27.5667]);

                const map = new window.ymaps.Map(mapRef.current, {
                    center,
                    zoom: 12,
                    controls: ['zoomControl', 'fullscreenControl']
                });

                mapInstanceRef.current = map;

                if (userCoords) {
                    const youAreHere = userAddress
                        ? `${t('mapYouAreHere')}: ${userAddress}`
                        : t('mapYouAreHere');
                    map.geoObjects.add(new window.ymaps.Placemark(
                        [userCoords.lat, userCoords.lon],
                        { hintContent: youAreHere, balloonContent: youAreHere },
                        { preset: 'islands#blueHomeIcon' }
                    ));
                }

                getAdvertGroups(adverts).forEach((group) => {
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

                    map.geoObjects.add(new window.ymaps.Placemark(
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

                if (adverts.length > 0) {
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
        };
    }, [isOpen, adverts, userCoords, userAddress, t]);

    useEffect(() => {
        if (loading) return;

        const map = mapInstanceRef.current;
        const bounds = pendingBoundsRef.current;
        if (!map || !bounds) return;

        pendingBoundsRef.current = null;

        // Карта создаётся в скрытом контейнере, поэтому размеры нужно пересчитать
        // после появления, иначе подгонка границ может дать мировой масштаб.
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