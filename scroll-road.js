document.addEventListener('DOMContentLoaded', () => {
    const road = document.createElement('div');
    road.className = 'scroll-road';
    road.setAttribute('aria-hidden', 'false');
    road.innerHTML = `
        <div class="scroll-road__track">
            <button
                class="scroll-road__car"
                type="button"
                role="slider"
                aria-label="Page scroll position"
                aria-orientation="vertical"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="0"
                aria-valuetext="Top of page"
            >
                <svg viewBox="0 0 24 36" aria-hidden="true" focusable="false">
                    <path class="scroll-road__wheel" d="M2 9h3v7H2zm17 0h3v7h-3zM2 22h3v7H2zm17 0h3v7h-3z" />
                    <path class="scroll-road__body" d="M6 3.5A3.5 3.5 0 0 1 9.5 0h5A3.5 3.5 0 0 1 18 3.5v29a3.5 3.5 0 0 1-3.5 3.5h-5A3.5 3.5 0 0 1 6 32.5z" />
                    <path class="scroll-road__window" d="M8.2 9.2 9.4 5h5.2l1.2 4.2v4.3H8.2zm0 9.3h7.6v7H8.2z" />
                    <path class="scroll-road__light" d="M8 2h2v1.5H8zm6 0h2v1.5h-2z" />
                </svg>
            </button>
        </div>
    `;

    const track = road.querySelector('.scroll-road__track');
    const car = road.querySelector('.scroll-road__car');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let updateFrame = 0;
    let dragging = false;

    const scrollToRatio = (ratio, behavior = 'instant') => {
        const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
        );
        window.scrollTo({ top: maxScroll * ratio, behavior });
    };

    const ratioFromPointer = (clientY) => {
        const bounds = track.getBoundingClientRect();
        const travel = Math.max(bounds.height - car.offsetHeight, 0);
        return travel === 0
            ? 0
            : Math.min(Math.max((clientY - bounds.top - car.offsetHeight / 2) / travel, 0), 1);
    };

    const update = () => {
        updateFrame = 0;
        const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
        );
        const ratio = maxScroll === 0
            ? 0
            : Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        const travel = Math.max(track.clientHeight - car.offsetHeight, 0);
        const percentage = Math.round(ratio * 100);

        road.classList.toggle('is-visible', maxScroll > 0);
        car.style.top = `${car.offsetHeight / 2 + travel * ratio}px`;
        car.setAttribute('aria-valuenow', String(percentage));
        car.setAttribute(
            'aria-valuetext',
            percentage === 0
                ? 'Top of page'
                : percentage === 100
                    ? 'Bottom of page'
                    : `${percentage}% of page`
        );
        document.documentElement.classList.toggle('has-scroll-road', maxScroll > 0);
    };

    const scheduleUpdate = () => {
        if (!updateFrame) {
            updateFrame = window.requestAnimationFrame(update);
        }
    };

    road.addEventListener('click', (event) => {
        if (event.target === track) {
            scrollToRatio(ratioFromPointer(event.clientY), reducedMotion.matches ? 'auto' : 'smooth');
        }
    });

    car.addEventListener('pointerdown', (event) => {
        dragging = true;
        car.setPointerCapture(event.pointerId);
        scrollToRatio(ratioFromPointer(event.clientY));
        event.preventDefault();
    });

    car.addEventListener('pointermove', (event) => {
        if (dragging) {
            scrollToRatio(ratioFromPointer(event.clientY));
        }
    });

    const stopDragging = () => {
        dragging = false;
    };
    car.addEventListener('pointerup', stopDragging);
    car.addEventListener('pointercancel', stopDragging);
    car.addEventListener('lostpointercapture', stopDragging);

    car.addEventListener('keydown', (event) => {
        const currentRatio = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
        ) === 0
            ? 0
            : window.scrollY /
                (document.documentElement.scrollHeight - window.innerHeight);
        const step = event.key === 'PageDown' || event.key === 'PageUp' ? 0.2 : 0.05;
        let nextRatio;

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
            case 'PageDown':
                nextRatio = currentRatio + step;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
            case 'PageUp':
                nextRatio = currentRatio - step;
                break;
            case 'Home':
                nextRatio = 0;
                break;
            case 'End':
                nextRatio = 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        scrollToRatio(Math.min(Math.max(nextRatio, 0), 1));
    });

    document.body.append(road);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('load', scheduleUpdate);
    new ResizeObserver(scheduleUpdate).observe(document.body);
    update();
});
