import {logger} from 'firebase-functions';

export const daysBetweenDates = (d1: Date, d2: Date) => {
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateRandomIndex = (length: number, dateSeed: Date, random: boolean) => {
  const date = dateSeed || new Date();
  date.setDate(date.getDate() + 1); // force add day just to be unpredictable
  const forceRand = random ? Math.random() * 10 * (Math.random() + 20) : 0;
  const seed = daysBetweenDates(date, new Date('01/15/2002')) + forceRand;
  const rand = mulberry32(seed)();
  logger.info('Random Index Seed:', seed);
  logger.info('Random Index Result:', rand, Math.floor(rand * length));
  return Math.floor(rand * length);
};

const mulberry32 = (a: number) => {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
