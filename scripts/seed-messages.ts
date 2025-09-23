import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  // Create a booking, a client user, and two messages; returns booking id and message ids
  // NOTE: This script requires SERVICE_ROLE key for elevated permissions to create arbitrary rows.
  const clientUserId = '11111111-1111-1111-1111-111111111111';
  const guardUserId = '22222222-2222-2222-2222-222222222222';
  // create booking
  const { data: booking } = await supabase.from('bookings').insert([{
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    client_id: clientUserId,
    assigned_user_id: guardUserId,
    assigned_company_id: null,
    status: 'matching'
  }]).select().single();

  // create messages
  await supabase.from('messages').insert([
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', booking_id: booking.id, sender_id: clientUserId, body: 'hello' },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', booking_id: booking.id, sender_id: guardUserId, body: 'hi' }
  ]);

  console.log('seeded booking', booking.id);
}

run().catch((e) => { console.error(e); process.exit(1); });
