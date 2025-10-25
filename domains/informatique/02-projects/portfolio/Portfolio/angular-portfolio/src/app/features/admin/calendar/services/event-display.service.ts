import { Injectable } from '@angular/core';
import { CapsuleType, EventCapsule } from '../../../../shared/components/event-capsule/event-capsule.component';

export interface CalendarEventResponse {
  id: number;
  title: string;
  description?: string;
  start_datetime: Date | string;
  end_datetime?: Date | string;
  location?: string;
  status?: string;
  category?: string;
  all_day?: boolean;
  priority?: string;
  tags?: string;
  participants?: any[];
  recurrence_pattern?: any;
  created_by_user_id?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  is_past?: boolean;
  is_today?: boolean;
  is_upcoming?: boolean;
}

export interface EventCapsuleWithDate extends EventCapsule {
  displayDate: Date;
  originalEvent: CalendarEventResponse;
}

@Injectable({
  providedIn: 'root'
})
export class EventDisplayService {

  /**
   * Sépare un événement multi-jours en 2 capsules : début et fin
   * Si l'événement est d'un seul jour, retourne une seule capsule 'single'
   */
  splitMultiDayEvent(event: CalendarEventResponse): EventCapsuleWithDate[] {
    const start = new Date(event.start_datetime);
    const end = event.end_datetime ? new Date(event.end_datetime) : new Date(event.start_datetime);
    
    // Normaliser à 00h00 pour comparaison des dates
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    
    const isSameDay = startDate.getTime() === endDate.getTime();
    
    if (isSameDay) {
      // Événement d'un seul jour
      return [{
        ...event,
        type: 'single',
        displayDate: startDate,
        originalEvent: event,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime
      }];
    } else {
      // Événement multi-jours → 2 capsules (début et fin)
      return [
        {
          ...event,
          type: 'start',
          displayDate: startDate,
          originalEvent: event,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime
        },
        {
          ...event,
          type: 'end',
          displayDate: endDate,
          originalEvent: event,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime
        }
      ];
    }
  }

  /**
   * Récupère toutes les capsules d'événements pour une date donnée
   */
  getEventsForDate(events: CalendarEventResponse[], targetDate: Date): EventCapsuleWithDate[] {
    const normalizedTargetDate = new Date(targetDate);
    normalizedTargetDate.setHours(0, 0, 0, 0);
    
    console.log(`🔍 Filtrage des événements pour la date: ${normalizedTargetDate.toDateString()}`);
    console.log(`🔍 Nombre d'événements à filtrer: ${events.length}`);
    
    const capsules: EventCapsuleWithDate[] = [];
    
    events.forEach((event, index) => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = event.end_datetime ? new Date(event.end_datetime) : new Date(event.start_datetime);
      
      const eventStartDate = new Date(eventStart);
      eventStartDate.setHours(0, 0, 0, 0);
      const eventEndDate = new Date(eventEnd);
      eventEndDate.setHours(0, 0, 0, 0);
      
      console.log(`🔍 Événement ${index + 1}: "${event.title}"`);
      console.log(`🔍   - Début: ${eventStartDate.toDateString()}`);
      console.log(`🔍   - Fin: ${eventEndDate.toDateString()}`);
      console.log(`🔍   - Date cible: ${normalizedTargetDate.toDateString()}`);
      console.log(`🔍   - Touche la date: ${normalizedTargetDate >= eventStartDate && normalizedTargetDate <= eventEndDate}`);
      
      // Vérifier si l'événement touche la date cible (début, fin, ou continuation)
      if (normalizedTargetDate >= eventStartDate && normalizedTargetDate <= eventEndDate) {
        const eventCapsules = this.splitMultiDayEvent(event);
        
        // Trouver la capsule qui correspond à cette date
        const matchingCapsule = eventCapsules.find(capsule => {
          const capsuleDate = new Date(capsule.displayDate);
          capsuleDate.setHours(0, 0, 0, 0);
          return capsuleDate.getTime() === normalizedTargetDate.getTime();
        });
        
        if (matchingCapsule) {
          // Utiliser la capsule existante
          console.log(`🔍   ✅ Capsule trouvée: "${matchingCapsule.title}"`);
          capsules.push(matchingCapsule);
        } else {
          // Créer une capsule "continuation" pour cette date
          const firstCapsule = eventCapsules[0];
          const continuationCapsule: EventCapsuleWithDate = {
            ...firstCapsule,
            type: 'continuation' as CapsuleType,
            displayDate: normalizedTargetDate,
            title: firstCapsule.title + ' (suite)',
            start_datetime: normalizedTargetDate,
            end_datetime: normalizedTargetDate
          };
          console.log(`🔍   ✅ Capsule continuation créée: "${continuationCapsule.title}"`);
          capsules.push(continuationCapsule);
        }
      } else {
        console.log(`🔍   ❌ Événement ignoré (ne touche pas la date)`);
      }
    });
    
    console.log(`🔍 Résultat: ${capsules.length} capsules trouvées pour ${normalizedTargetDate.toDateString()}`);
    
    // Trier par heure de début
    return capsules.sort((a, b) => {
      const timeA = new Date(a.start_datetime).getTime();
      const timeB = new Date(b.start_datetime).getTime();
      return timeA - timeB;
    });
  }

  /**
   * Calcule la position (top) d'une capsule dans une timeline
   * @param capsule - La capsule d'événement
   * @param dayDate - La date du jour affiché (pour WEEK/DAY)
   * @param pixelsPerHour - Hauteur en pixels d'une heure (défaut: 80px)
   */
  calculateEventTop(capsule: EventCapsuleWithDate, dayDate: Date, pixelsPerHour: number = 80): number {
    const eventStart = new Date(capsule.start_datetime);
    const eventEnd = capsule.end_datetime ? new Date(capsule.end_datetime) : new Date(capsule.start_datetime);
    
    // Normaliser la date du jour
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    let displayStart: Date;
    
    // Déterminer l'heure de début d'affichage
    if (capsule.type === 'start') {
      // Capsule de début : afficher à l'heure de début réelle
      displayStart = eventStart;
    } else if (capsule.type === 'end') {
      // Capsule de fin : si l'événement commence avant ce jour, afficher à 00h00
      if (eventStart < dayStart) {
        displayStart = dayStart;
      } else {
        displayStart = eventStart;
      }
    } else {
      // Single : afficher à l'heure de début
      displayStart = eventStart;
    }
    
    const hours = displayStart.getHours();
    const minutes = displayStart.getMinutes();
    return (hours * pixelsPerHour) + (minutes * pixelsPerHour / 60);
  }

  /**
   * Calcule la hauteur d'une capsule dans une timeline
   * @param capsule - La capsule d'événement
   * @param dayDate - La date du jour affiché
   * @param pixelsPerHour - Hauteur en pixels d'une heure (défaut: 80px)
   */
  calculateEventHeight(capsule: EventCapsuleWithDate, dayDate: Date, pixelsPerHour: number = 80): number {
    const eventStart = new Date(capsule.start_datetime);
    const eventEnd = capsule.end_datetime ? new Date(capsule.end_datetime) : new Date(capsule.start_datetime);
    
    // Normaliser la date du jour
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    let displayStart: Date;
    let displayEnd: Date;
    
    // Déterminer les heures de début et fin d'affichage
    if (capsule.type === 'start') {
      // Capsule de début
      displayStart = eventStart;
      // Si l'événement se termine après ce jour, couper à 23h59
      displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
    } else if (capsule.type === 'end') {
      // Capsule de fin
      // Si l'événement commence avant ce jour, commencer à 00h00
      displayStart = eventStart < dayStart ? dayStart : eventStart;
      displayEnd = eventEnd;
    } else {
      // Single
      displayStart = eventStart;
      displayEnd = eventEnd;
    }
    
    // Validation
    if (displayEnd < displayStart) {
      console.warn(`⚠️ Calcul de hauteur invalide pour événement ${capsule.id}`);
      return pixelsPerHour * 0.5; // Minimum 30min
    }
    
    const durationMinutes = (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60);
    const validDuration = Math.max(30, durationMinutes); // Minimum 30 minutes
    
    return Math.max(40, (validDuration * pixelsPerHour / 60)); // Min 40px
  }

  /**
   * Calcule la position pour un événement dans une vue timeline (WEEK ou DAY)
   */
  calculatePosition(capsule: EventCapsuleWithDate, dayDate: Date, pixelsPerHour: number = 80): {top: number, height: number} {
    return {
      top: this.calculateEventTop(capsule, dayDate, pixelsPerHour),
      height: this.calculateEventHeight(capsule, dayDate, pixelsPerHour)
    };
  }

  /**
   * Détecte les collisions entre événements pour une colonne (jour) donnée
   */
  detectCollisions(capsules: EventCapsuleWithDate[], dayDate: Date, pixelsPerHour: number = 80): Map<EventCapsuleWithDate, EventCapsuleWithDate[]> {
    const collisions = new Map<EventCapsuleWithDate, EventCapsuleWithDate[]>();
    
    capsules.forEach(capsule => {
      const pos1 = this.calculatePosition(capsule, dayDate, pixelsPerHour);
      const overlapping: EventCapsuleWithDate[] = [];
      
      capsules.forEach(otherCapsule => {
        if (capsule.id === otherCapsule.id) return;
        
        const pos2 = this.calculatePosition(otherCapsule, dayDate, pixelsPerHour);
        
        // Vérifier si les deux événements se superposent verticalement
        const isOverlapping = !(pos1.top + pos1.height <= pos2.top || pos2.top + pos2.height <= pos1.top);
        
        if (isOverlapping) {
          overlapping.push(otherCapsule);
        }
      });
      
      collisions.set(capsule, overlapping);
    });
    
    return collisions;
  }

  /**
   * Calcule la largeur et le décalage horizontal pour gérer les collisions
   */
  calculateCollisionLayout(
    capsule: EventCapsuleWithDate,
    allCapsules: EventCapsuleWithDate[],
    dayDate: Date,
    containerWidth: number = 100,
    pixelsPerHour: number = 80
  ): {left: number, width: number} {
    const collisions = this.detectCollisions(allCapsules, dayDate, pixelsPerHour);
    const overlapping = collisions.get(capsule) || [];
    
    if (overlapping.length === 0) {
      // Pas de collision : pleine largeur
      return { left: 0, width: containerWidth };
    }
    
    // Nombre total d'événements en collision (incluant celui-ci)
    const totalOverlapping = overlapping.length + 1;
    
    // Trouver l'index de cette capsule parmi les événements qui se chevauchent
    const sortedCapsules = [capsule, ...overlapping].sort((a, b) => {
      const timeA = new Date(a.start_datetime).getTime();
      const timeB = new Date(b.start_datetime).getTime();
      return timeA - timeB;
    });
    
    const index = sortedCapsules.findIndex(c => c.id === capsule.id);
    
    // Calculer la largeur et la position
    const width = containerWidth / totalOverlapping;
    const left = index * width;
    
    return { left, width };
  }

  /**
   * Valide et corrige un événement si nécessaire
   * (par exemple, si end < start)
   */
  validateAndFixEvent(event: CalendarEventResponse): CalendarEventResponse {
    const start = new Date(event.start_datetime);
    const end = event.end_datetime ? new Date(event.end_datetime) : new Date(event.start_datetime);
    
    if (end < start) {
      console.warn(`⚠️ Événement invalide détecté (ID: ${event.id}): la fin est avant le début`);
      // Corriger: mettre la fin 1 heure après le début
      const correctedEnd = new Date(start);
      correctedEnd.setHours(start.getHours() + 1);
      
      return {
        ...event,
        end_datetime: correctedEnd
      };
    }
    
    // Vérifier durée minimum
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 1000 * 60 * 15) { // Moins de 15 minutes
      const correctedEnd = new Date(start);
      correctedEnd.setMinutes(start.getMinutes() + 30); // Minimum 30min
      
      return {
        ...event,
        end_datetime: correctedEnd
      };
    }
    
    return event;
  }

  /**
   * Génère les jours d'un mois pour la vue MONTH
   */
  generateMonthDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Jours du mois précédent pour remplir la première semaine
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push(date);
    }
    
    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }
    
    // Jours du mois suivant pour remplir la dernière semaine
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(date);
    }
    
    return days;
  }

  /**
   * Génère les jours d'une semaine
   */
  generateWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  }
}

