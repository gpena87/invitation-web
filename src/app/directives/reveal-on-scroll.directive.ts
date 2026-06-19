import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer: IntersectionObserver | null = null;
  private static scrollDirection: 'up' | 'down' = 'down';
  private static lastScrollTop = 0;

  constructor() {
    // Inicializar listener global de scroll si no está ya configurado
    if (!document.body.dataset['scrollListenerActive']) {
      document.body.dataset['scrollListenerActive'] = 'true';
      window.addEventListener('scroll', RevealOnScrollDirective.handleGlobalScroll, { passive: true });
    }
  }

  private static handleGlobalScroll = (): void => {
    const scrollTop = window.scrollY;
    RevealOnScrollDirective.scrollDirection = scrollTop > RevealOnScrollDirective.lastScrollTop ? 'down' : 'up';
    RevealOnScrollDirective.lastScrollTop = scrollTop;
  };

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;

    this.renderer.addClass(element, 'transition-all');
    this.renderer.addClass(element, 'duration-700');
    this.renderer.addClass(element, 'ease-out');
    this.renderer.addClass(element, 'motion-reduce:transition-none');
    this.renderer.addClass(element, 'opacity-0');
    this.initializeHiddenState(element);

    if (typeof IntersectionObserver === 'undefined') {
      this.revealElement(element);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.revealElement(entry.target as HTMLElement);
          } else {
            this.hideElement(entry.target as HTMLElement);
          }
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private initializeHiddenState(element: HTMLElement): void {
    const direction = RevealOnScrollDirective.scrollDirection;
    if (direction === 'down') {
      this.renderer.addClass(element, 'translate-y-6');
      this.renderer.removeClass(element, '-translate-y-6');
    } else {
      this.renderer.addClass(element, '-translate-y-6');
      this.renderer.removeClass(element, 'translate-y-6');
    }
  }

  private revealElement(element: HTMLElement): void {
    this.renderer.removeClass(element, 'opacity-0');
    this.renderer.removeClass(element, 'translate-y-6');
    this.renderer.removeClass(element, '-translate-y-6');
    this.renderer.addClass(element, 'opacity-100');
    this.renderer.addClass(element, 'translate-y-0');
  }

  private hideElement(element: HTMLElement): void {
    const direction = RevealOnScrollDirective.scrollDirection;
    this.renderer.removeClass(element, 'opacity-100');
    this.renderer.removeClass(element, 'translate-y-0');
    this.renderer.addClass(element, 'opacity-0');

    if (direction === 'down') {
      this.renderer.addClass(element, 'translate-y-6');
      this.renderer.removeClass(element, '-translate-y-6');
    } else {
      this.renderer.addClass(element, '-translate-y-6');
      this.renderer.removeClass(element, 'translate-y-6');
    }
  }
}
