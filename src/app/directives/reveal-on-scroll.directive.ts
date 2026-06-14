import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;

    this.renderer.addClass(element, 'transition-all');
    this.renderer.addClass(element, 'duration-700');
    this.renderer.addClass(element, 'ease-out');
    this.renderer.addClass(element, 'motion-reduce:transition-none');
    this.renderer.addClass(element, 'opacity-0');
    this.renderer.addClass(element, 'translate-y-6');

    if (typeof IntersectionObserver === 'undefined') {
      this.revealElement(element);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          this.revealElement(element);
          this.observer?.disconnect();
          this.observer = null;
          break;
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

  private revealElement(element: HTMLElement): void {
    this.renderer.removeClass(element, 'opacity-0');
    this.renderer.removeClass(element, 'translate-y-6');
    this.renderer.addClass(element, 'opacity-100');
    this.renderer.addClass(element, 'translate-y-0');
  }
}
