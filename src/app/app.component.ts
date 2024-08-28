import { Component, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  cards = Array.from({ length: 31 }, (_, i) => i);  // Generate cards from 0 to 30
  scrub: any;
  seamlessLoop: any;
  spacing = 0.1;
  iteration = 0;
  scrollTrigger: ScrollTrigger | null = null;

  ngAfterViewInit(): void {
    const spacing = this.spacing;
    const cards = gsap.utils.toArray('.cards li');
    this.seamlessLoop = this.buildSeamlessLoop(cards, spacing);
    this.scrub = gsap.to(this.seamlessLoop, {
      totalTime: 0,
      duration: 0.5,
      ease: "power3",
      paused: true
    });

    this.scrollTrigger = ScrollTrigger.create({
      start: 0,
      onUpdate: (self) => {
        if (self.progress === 1 && self.direction > 0) {
          this.wrapForward();
        } else if (self.progress < 1e-5 && self.direction < 0) {
          this.wrapBackward();
        } else {
          this.scrub.vars.totalTime = gsap.utils.snap(spacing)((this.iteration + self.progress) * this.seamlessLoop.duration());
          this.scrub.invalidate().restart();
        }
      },
      end: "+=3000",
      pin: ".gallery"
    });
  }

  wrapForward(): void {
    this.iteration++;
    if (this.scrollTrigger) {
      this.scrollTrigger.scroll(this.scrollTrigger.start + 1);
    }
  }

  wrapBackward(): void {
    this.iteration--;
    if (this.iteration < 0) {
      this.iteration = 9;
      this.seamlessLoop.totalTime(this.seamlessLoop.totalTime() + this.seamlessLoop.duration() * 10);
      this.scrub.pause();
    }
    if (this.scrollTrigger) {
      this.scrollTrigger.scroll(this.scrollTrigger.end - 1);
    }
  }

  scrubTo(totalTime: number): void {
    const progress = (totalTime - this.seamlessLoop.duration() * this.iteration) / this.seamlessLoop.duration();
    if (progress > 1) {
      this.wrapForward();
    } else if (progress < 0) {
      this.wrapBackward();
    } else if (this.scrollTrigger) {
      this.scrollTrigger.scroll(this.scrollTrigger.start + progress * (this.scrollTrigger.end - this.scrollTrigger.start));
    }
  }

  buildSeamlessLoop(items: any[], spacing: number): any {
    const overlap = Math.ceil(1 / spacing),
          startTime = items.length * spacing + 0.5,
          loopTime = (items.length + overlap) * spacing + 1,
          rawSequence = gsap.timeline({ paused: true }),
          seamlessLoop = gsap.timeline({
            paused: true,
            repeat: -1,
            onRepeat() {
              this['_time'] === this['_dur'] && (this['_tTime'] += this['_dur'] - 0.01);
            }
          }),
          l = items.length + overlap * 2,
          time = 0;

    gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

    for (let i = 0; i < l; i++) {
      const index = i % items.length;
      const item = items[index];
      const time = i * spacing;
      rawSequence.fromTo(item, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false }, time)
        .fromTo(item, { xPercent: 400 }, { xPercent: -400, duration: 1, ease: "none", immediateRender: false }, time);
      i <= items.length && seamlessLoop.add("label" + i, time);
    }

    rawSequence.time(startTime);
    seamlessLoop.to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: "none"
    }).fromTo(rawSequence, { time: overlap * spacing + 1 }, {
      time: startTime,
      duration: startTime - (overlap * spacing + 1),
      immediateRender: false,
      ease: "none"
    });
    return seamlessLoop;
  }
}
