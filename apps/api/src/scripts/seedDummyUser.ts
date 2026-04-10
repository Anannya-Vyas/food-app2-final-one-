/**
 * Seeds a dummy active user "Priya Sharma" with real activity:
 * - User account in PostgreSQL
 * - Ratings on 20 recipes
 * - Comments on 10 recipes
 * - 3 feed posts in MongoDB
 *
 * Run: npx tsx src/scripts/seedDummyUser.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI!;

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  // Dynamic import of models after mongoose connects
  const { Comment } = await import('../models/Comment');
  const { Post } = await import('../models/Post');

  console.log('\n1. Creating dummy user...');

  const passwordHash = await bcrypt.hash('Priya@1234', 10);

  let user = await prisma.user.findFirst({ where: { email: 'priya@culinarycompass.app' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'priya@culinarycompass.app',
        passwordHash,
        displayName: 'Priya Sharma',
        bio: 'Home cook from Delhi. Obsessed with regional Indian food and fermentation. 🍛',
        preferredLang: 'en',
        isPremium: false,
        subscriptionStatus: 'trial',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      },
    });
    console.log(`  ✓ Created user: ${user.email} (password: Priya@1234)`);
  } else {
    console.log(`  Skipping — user already exists: ${user.email}`);
  }

  console.log('\n2. Adding ratings to recipes...');
  const recipes = await prisma.recipe.findMany({ where: { status: 'published' }, take: 30, orderBy: { createdAt: 'asc' } });

  const ratingValues = [5, 4, 5, 3, 4, 5, 4, 5, 4, 3, 5, 4, 5, 4, 5, 3, 4, 5, 4, 5];
  let ratingsAdded = 0;
  for (let i = 0; i < Math.min(20, recipes.length); i++) {
    const recipe = recipes[i];
    const existing = await prisma.rating.findFirst({ where: { userId: user.id, recipeId: recipe.id } });
    if (!existing) {
      await prisma.rating.create({
        data: { userId: user.id, recipeId: recipe.id, value: ratingValues[i % ratingValues.length] },
      });
      ratingsAdded++;
    }
  }
  console.log(`  ✓ Added ${ratingsAdded} ratings`);

  console.log('\n3. Adding comments to recipes...');
  const COMMENTS = [
    'This recipe is absolutely divine! Made it for my family last Sunday and everyone asked for seconds. The spice balance is perfect.',
    'I\'ve been making this for years but this version has a secret I never knew — the technique makes all the difference. Thank you!',
    'Tried this last night. Added a bit more ginger and it was incredible. This is now my go-to recipe.',
    'My grandmother used to make something very similar. This brought back so many memories. Beautiful recipe.',
    'The instructions are so clear and easy to follow. Even a beginner like me could make this perfectly!',
    'I substituted the cream with coconut milk for a dairy-free version and it worked beautifully.',
    'Made this for a dinner party and got so many compliments. The cultural context in the description really adds something special.',
    'This is authentic! I\'m from this region and this is exactly how my mother makes it.',
    'The flavor spectrum is spot on. That balance of spicy and savory is what makes this dish unique.',
    'Added this to my weekly rotation. Simple, healthy, and absolutely delicious.',
  ];

  let commentsAdded = 0;
  for (let i = 0; i < Math.min(10, recipes.length); i++) {
    const recipe = recipes[i];
    const existing = await Comment.findOne({ recipe_id: recipe.id, author_id: user.id });
    if (!existing) {
      const { Types } = mongoose;
      await Comment.create({
        post_id: new Types.ObjectId(),
        recipe_id: recipe.id,
        author_id: user.id,
        text: COMMENTS[i % COMMENTS.length],
        status: 'published',
      });
      commentsAdded++;
    }
  }
  console.log(`  ✓ Added ${commentsAdded} comments`);

  console.log('\n4. Creating feed posts...');
  const POSTS = [
    {
      caption: 'Just made Dal Makhani from scratch for the first time! The secret is slow cooking the dal overnight on a low flame. The depth of flavor is unreal. This is what Sunday cooking is all about. 🫘❤️',
      media: [{ type: 'image' as const, url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', size_bytes: 0 }],
    },
    {
      caption: 'Exploring the spice markets of Old Delhi today. Found some incredible Kashmiri saffron and black cardamom. The smell alone is worth the trip. Every spice has a story — that\'s what this app is all about. 🌶️🧡',
      media: [{ type: 'image' as const, url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', size_bytes: 0 }],
    },
    {
      caption: 'My grandmother\'s recipe for Methi Thepla — a Gujarati flatbread made with fresh fenugreek leaves. She taught me this when I was 8 years old. Some recipes are more than food, they\'re memory. 👵💛',
      media: [{ type: 'image' as const, url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80', size_bytes: 0 }],
    },
  ];

  let postsAdded = 0;
  for (const postData of POSTS) {
    const existing = await Post.findOne({ author_id: user.id, caption: postData.caption });
    if (!existing) {
      await Post.create({
        author_id: user.id,
        caption: postData.caption,
        media: postData.media,
        recipe_tags: [],
        status: 'published',
        likes_count: Math.floor(Math.random() * 80) + 20,
        comments_count: Math.floor(Math.random() * 15) + 3,
        shares_count: Math.floor(Math.random() * 10) + 1,
      });
      postsAdded++;
    }
  }
  console.log(`  ✓ Added ${postsAdded} feed posts`);

  console.log('\n✅ Dummy user seeded successfully!');
  console.log('   Email: priya@culinarycompass.app');
  console.log('   Password: Priya@1234');
  console.log('   This user has ratings, comments, and posts visible in the app.');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
