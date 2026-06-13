import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy } from '@angular/core';

// Wedding date: June 22, 2026 at 00:00 UTC
const WEDDING_DATE = new Date(2027, 3, 20, 0, 0, 0).getTime();

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-countdown',
  imports: [],
  templateUrl: './countdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent implements OnInit, OnDestroy {
  title = signal('¡La cuenta regresiva ha comenzado!');
  subtitle = signal('Estamos emocionados de compartir este momento contigo. ¡Faltan pocos días para la gran celebración!');

  days = signal(0);
  hours = signal(0);
  minutes = signal(0);
  seconds = signal(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const difference = WEDDING_DATE - now;

    if (difference <= 0) {
      this.days.set(0);
      this.hours.set(0);
      this.minutes.set(0);
      this.seconds.set(0);
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    const timeData: CountdownTime = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };

    this.days.set(timeData.days);
    this.hours.set(timeData.hours);
    this.minutes.set(timeData.minutes);
    this.seconds.set(timeData.seconds);
  }
}
