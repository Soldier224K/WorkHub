const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./src/config/db');
const Member = require('./src/modules/members/member.model');
const Space = require('./src/modules/spaces/space.model');
const Booking = require('./src/modules/bookings/booking.model');
const { toSlotKeys } = require('./src/shared/slots');

async function seedTomorrow() {
  await connectDB();
  const sarah = await Member.findOne({ email: 'sarah@cyberdyne.io' });
  const alex = await Member.findOne({ email: 'alex@acme.com' });
  const manager = await Member.findOne({ email: 'manager@workhub.io' });
  const spaces = await Space.find({});

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  console.log('Seeding bookings for tomorrow: ' + tomorrow.toISOString().slice(0,10));
  
  const bookings = [];
  
  for(let i=0; i<15; i++) {
    const space = spaces[Math.floor(Math.random() * spaces.length)];
    const member = [sarah, alex, manager][Math.floor(Math.random() * 3)];
    
    const hour = Math.floor(Math.random() * 10) + 9;
    
    const startHour = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), hour, 0, 0));
    const endHour = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), hour + 2, 0, 0));
    
    const slotKeys = toSlotKeys(startHour, endHour);
    
    const existing = await Booking.findOne({
      resource: space._id,
      slotKeys: { $in: slotKeys },
      status: 'confirmed'
    });
    
    if(!existing) {
      bookings.push({
        member: member._id,
        resource: space._id,
        start: startHour,
        end: endHour,
        slotKeys: slotKeys,
        holding: true,
        status: 'confirmed',
        price: 0,
        notes: 'Mock data booking'
      });
    }
  }
  
  if (bookings.length > 0) {
    await Booking.insertMany(bookings);
    console.log('Successfully seeded ' + bookings.length + ' active bookings for tomorrow!');
  } else {
    console.log('No bookings could be created (slots might be full).');
  }

  await disconnectDB();
}

seedTomorrow().catch(console.error);
