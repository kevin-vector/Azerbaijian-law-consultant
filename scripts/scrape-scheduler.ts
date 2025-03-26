import * as schedule from 'node-schedule';
import { supabase } from '../lib/supabase';

schedule.scheduleJob('0 8 * * *', async () => {
    console.log('Starting scheduled scrape post at', new Date().toISOString());
    const res = await fetch('/api/scrape-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });    
    const data = await res.json();
    console.log('Scheduled post scrape completed');
});

schedule.scheduleJob('0 9 * * *', async () => {
    console.log('Starting scheduled scrape law at', new Date().toISOString());
    const res = await fetch('/api/scrape-law', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });    
    const data = await res.json();
    console.log('Scheduled law scrape completed');
});