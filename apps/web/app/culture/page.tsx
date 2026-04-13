'use client';

import { useState } from 'react';
import Link from 'next/link';

const FOOD_RITUALS = [
  { month: 'January', festival: 'Makar Sankranti', country: 'India', dish: 'Til Ladoo & Khichdi', story: 'The harvest festival of the sun. Sesame seeds (til) represent warmth and prosperity. Families fly kites and share til ladoo — the sweetness of sesame symbolizes the sweetness of new beginnings.', emoji: '🪁', color: 'bg-tertiary-fixed' },
  { month: 'January', festival: 'Pongal', country: 'Tamil Nadu, India', dish: 'Sweet Pongal', story: 'The Tamil harvest festival. Rice is cooked in a new clay pot until it overflows — "Pongal!" means "it boils over!" — symbolizing abundance. The overflow is a blessing.', emoji: '🍚', color: 'bg-secondary-fixed' },
  { month: 'January', festival: 'Lohri', country: 'Punjab, India', dish: 'Rewri, Gajak & Popcorn', story: 'The bonfire festival of Punjab. Families gather around a fire, throwing sesame seeds, jaggery, and popcorn into the flames as offerings. The fire represents the sun returning after winter.', emoji: '🔥', color: 'bg-primary-fixed' },
  { month: 'February', festival: 'Chinese New Year', country: 'China', dish: 'Dumplings & Fish', story: 'Dumplings shaped like ancient gold ingots bring wealth. Fish (鱼, yú) sounds like "surplus" — always served whole, never cut, so luck stays intact. The last bite is saved for tomorrow.', emoji: '🥟', color: 'bg-tertiary-fixed' },
  { month: 'February', festival: 'Vasant Panchami', country: 'India', dish: 'Yellow Sweets & Saffron Rice', story: 'The festival of spring and Goddess Saraswati. Everything is yellow — the color of mustard flowers blooming across Punjab. Yellow rice, yellow sweets, yellow clothes. Spring has arrived.', emoji: '🌼', color: 'bg-secondary-fixed' },
  { month: 'February', festival: 'Mardi Gras', country: 'New Orleans, USA', dish: 'King Cake & Beignets', story: 'The last feast before Lent. A baby figurine is hidden inside the King Cake — whoever finds it must host next year\'s party. Beignets dusted with powdered sugar are eaten at Café Du Monde at 3am.', emoji: '🎭', color: 'bg-primary-fixed' },
  { month: 'March', festival: 'Holi', country: 'India', dish: 'Gujiya & Thandai', story: 'The festival of colors. Gujiya — sweet dumplings filled with khoya — are made in every home. Thandai, a spiced milk drink, cools the body after hours of playing with colors in the spring heat.', emoji: '🎨', color: 'bg-tertiary-fixed' },
  { month: 'March', festival: 'Nowruz', country: 'Iran/Central Asia', dish: 'Sabzi Polo Mahi', story: 'Persian New Year. Herb rice with fish — the green herbs represent spring\'s rebirth, the fish represents life. The Haft-Seen table has seven symbolic items, each starting with "S" in Persian.', emoji: '🌱', color: 'bg-secondary-fixed' },
  { month: 'March', festival: 'St. Patrick\'s Day', country: 'Ireland', dish: 'Corned Beef & Colcannon', story: 'Irish-Americans invented corned beef as a substitute for bacon when they arrived in America. Colcannon — mashed potatoes with cabbage and butter — is the true Irish dish. A coin is hidden inside for luck.', emoji: '☘️', color: 'bg-primary-fixed' },
  { month: 'April', festival: 'Ugadi', country: 'Karnataka/Andhra, India', dish: 'Ugadi Pachadi', story: 'Telugu New Year. Ugadi Pachadi is a chutney with six tastes — sweet, sour, bitter, spicy, salty, and astringent — representing the six emotions of life. You must taste all six to welcome the new year fully.', emoji: '🌿', color: 'bg-tertiary-fixed' },
  { month: 'April', festival: 'Vishu', country: 'Kerala, India', dish: 'Vishu Kanji & Sadya', story: 'The Malayalam New Year. The first thing you see on Vishu morning is the Vishukkani — an auspicious arrangement of rice, fruits, flowers, and gold. Then comes the feast: 26 dishes on a banana leaf.', emoji: '🌸', color: 'bg-secondary-fixed' },
  { month: 'April', festival: 'Easter', country: 'Global Christian', dish: 'Hot Cross Buns & Lamb', story: 'Hot cross buns were baked on Good Friday — the cross on top represents the crucifixion. Lamb is eaten at Easter because Jesus is called the "Lamb of God." In Greece, a whole lamb is roasted on a spit.', emoji: '🐣', color: 'bg-primary-fixed' },
  { month: 'May', festival: 'Eid al-Fitr', country: 'Global Muslim World', dish: 'Sheer Khurma & Biryani', story: 'Breaking the Ramadan fast. Sheer khurma — vermicelli cooked in milk with dates and nuts — is the first sweet of Eid morning. Biryani is the celebratory feast shared with neighbors.', emoji: '🌙', color: 'bg-tertiary-fixed' },
  { month: 'May', festival: 'Cinco de Mayo', country: 'Mexico', dish: 'Mole Poblano & Tamales', story: 'Celebrating the Battle of Puebla. Mole Poblano — a sauce with 20+ ingredients including chocolate and chili — was supposedly created by nuns who had nothing else to serve the general. It took three days to make.', emoji: '🇲🇽', color: 'bg-secondary-fixed' },
  { month: 'June', festival: 'Dragon Boat Festival', country: 'China', dish: 'Zongzi (Rice Dumplings)', story: 'Zongzi are sticky rice dumplings wrapped in bamboo leaves, thrown into the river to feed the fish so they wouldn\'t eat the body of the poet Qu Yuan. Today they\'re eaten to honor his memory.', emoji: '🐉', color: 'bg-primary-fixed' },
  { month: 'July', festival: 'Guru Purnima', country: 'India', dish: 'Kheer & Prasad', story: 'The full moon of the guru. Kheer — rice pudding cooked in milk with cardamom and saffron — is offered to teachers and elders. The white of the kheer represents the purity of knowledge.', emoji: '🌕', color: 'bg-tertiary-fixed' },
  { month: 'August', festival: 'Onam', country: 'Kerala, India', dish: 'Sadya (26-dish feast)', story: 'The harvest festival of Kerala. A banana leaf feast with 26 dishes — each placed in a specific position. The meal is eaten with the right hand only, sitting on the floor, in a specific order.', emoji: '🍌', color: 'bg-secondary-fixed' },
  { month: 'August', festival: 'Raksha Bandhan', country: 'India', dish: 'Mithai & Coconut Ladoo', story: 'Sisters tie a thread (rakhi) on their brother\'s wrist, and brothers give sweets in return. Coconut ladoo — made with fresh coconut, sugar, and cardamom — is the traditional sweet of this bond.', emoji: '🧵', color: 'bg-primary-fixed' },
  { month: 'August', festival: 'Janmashtami', country: 'India', dish: 'Makhan (Butter) & Panchamrit', story: 'Krishna\'s birthday. Makhan — fresh white butter — is offered because Krishna was famous for stealing butter as a child. Panchamrit (five nectars: milk, curd, honey, ghee, sugar) is the sacred drink.', emoji: '🧈', color: 'bg-tertiary-fixed' },
  { month: 'September', festival: 'Mid-Autumn Festival', country: 'China/Vietnam', dish: 'Mooncakes', story: 'Mooncakes are round like the full moon — a symbol of family reunion. Inside: lotus seed paste and a salted egg yolk representing the moon. Families eat them while gazing at the moon together.', emoji: '🥮', color: 'bg-secondary-fixed' },
  { month: 'September', festival: 'Ganesh Chaturthi', country: 'Maharashtra, India', dish: 'Modak', story: 'Modak is Ganesha\'s favorite sweet — a steamed dumpling filled with coconut and jaggery. The shape represents the universe. 21 modaks are offered to Ganesha on this day.', emoji: '🐘', color: 'bg-primary-fixed' },
  { month: 'October', festival: 'Navratri', country: 'India', dish: 'Sabudana Khichdi & Kuttu Puri', story: 'Nine nights of fasting and dancing. Sabudana (tapioca) khichdi and kuttu (buckwheat) puri are the fasting foods — no grains, no onion, no garlic. The body is purified for the goddess.', emoji: '💃', color: 'bg-tertiary-fixed' },
  { month: 'October', festival: 'Diwali', country: 'India', dish: 'Mithai & Chakli', story: 'The festival of lights. Every family makes their own mithai (sweets) — recipes passed down for generations. The smell of ghee and cardamom means Diwali is here. Sweets are exchanged as gifts of love.', emoji: '🪔', color: 'bg-secondary-fixed' },
  { month: 'October', festival: 'Sukkot', country: 'Israel/Jewish World', dish: 'Stuffed Vegetables & Honey Cake', story: 'The harvest festival of the Torah. Families build a sukkah (temporary hut) and eat inside it for 7 days. Stuffed vegetables represent the harvest. Honey cake is eaten for a sweet new year.', emoji: '🍯', color: 'bg-primary-fixed' },
  { month: 'November', festival: 'Thanksgiving', country: 'USA', dish: 'Turkey & Pumpkin Pie', story: 'A harvest feast rooted in 1621. The turkey, stuffing, cranberry sauce — each family has their own version. The meal is less about the food and more about the table it\'s shared at.', emoji: '🦃', color: 'bg-tertiary-fixed' },
  { month: 'November', festival: 'Chhath Puja', country: 'Bihar/UP, India', dish: 'Thekua & Kheer', story: 'The sun worship festival. Thekua — wheat flour cookies fried in ghee — are offered to the sun god. Devotees stand in rivers at sunrise and sunset for 36 hours without food or water.', emoji: '☀️', color: 'bg-secondary-fixed' },
  { month: 'December', festival: 'Christmas', country: 'Global', dish: 'Plum Pudding & Stollen', story: 'The Christmas pudding was stirred by every family member, each making a wish. Hidden inside: a coin for wealth, a ring for marriage. The tradition of hiding things in food is ancient magic.', emoji: '🎄', color: 'bg-primary-fixed' },
  { month: 'December', festival: 'Winter Solstice', country: 'Japan', dish: 'Yuzu Bath & Kabocha', story: 'On the shortest day, Japanese families bathe in yuzu-filled water for good health. Kabocha squash is eaten for luck. The yuzu\'s fragrance is said to ward off evil spirits.', emoji: '🍊', color: 'bg-tertiary-fixed' },
  { month: 'December', festival: 'Hanukkah', country: 'Jewish World', dish: 'Latkes & Sufganiyot', story: 'The festival of lights. Latkes (potato pancakes) and sufganiyot (jelly doughnuts) are fried in oil — commemorating the miracle of oil that burned for 8 days. One candle is lit each night.', emoji: '🕎', color: 'bg-secondary-fixed' },
  { month: 'December', festival: 'Kwanzaa', country: 'African-American', dish: 'Jollof Rice & Black-Eyed Peas', story: 'A celebration of African heritage. Jollof rice — cooked in tomato and spices — represents community. Black-eyed peas bring luck. The feast is called Karamu and happens on December 31st.', emoji: '🕯️', color: 'bg-primary-fixed' },
];

const ORIGIN_STORIES = [
  { dish: 'Biryani', origin: 'Persia → Mughal India', story: 'Biryani traveled the Silk Road from Persia to India with the Mughal armies. The word comes from Persian "birian" (fried before cooking). Each region adapted it — Hyderabadi dum biryani, Lucknowi awadhi, Kolkata biryani with potato. The potato was added during a famine when meat was scarce.', emoji: '🍚', year: '~1600 CE' },
  { dish: 'Ramen', origin: 'China → Japan', story: 'Ramen arrived in Japan with Chinese immigrants in the late 1800s. After WWII, American wheat flooded Japan and ramen became the food of survival. Each region developed its own soul — Sapporo\'s miso, Fukuoka\'s tonkotsu, Tokyo\'s shoyu. Today it\'s Japan\'s most beloved comfort food.', emoji: '🍜', year: '~1900 CE' },
  { dish: 'Tacos', origin: 'Pre-Columbian Mexico', story: 'Tacos predate the Spanish conquest. Aztec workers in silver mines used corn tortillas to hold their food — the original "taco" meant a small charge of gunpowder wrapped in paper. The taco al pastor came from Lebanese immigrants who brought shawarma to Mexico City in the 1930s.', emoji: '🌮', year: '~1000 BCE' },
  { dish: 'Hummus', origin: 'Levant (disputed)', story: 'The oldest known hummus recipe is from 13th century Cairo. But chickpeas have been eaten in the Middle East for 10,000 years. Today, Lebanon, Israel, Palestine, and Syria all claim hummus as their own — a dish that transcends borders and belongs to everyone.', emoji: '🫘', year: '~1200 CE' },
  { dish: 'Kimchi', origin: 'Korea', story: 'Kimchi is 2,000 years old, but the chili pepper version is only 400 years old — chilies arrived from the Americas via Portuguese traders. Before chilies, kimchi was white. The fermentation process was developed to survive Korean winters. Today, 1.8 million tons are made annually.', emoji: '🥬', year: '~100 BCE' },
  { dish: 'Pasta', origin: 'China → Arab World → Italy', story: 'Marco Polo did NOT bring pasta to Italy — that\'s a myth. Arab traders brought dried pasta to Sicily in the 9th century. The Italians perfected it. The tomato sauce came only after 1492, when tomatoes arrived from the Americas. Before that, pasta was eaten with cheese and spices.', emoji: '🍝', year: '~900 CE' },
  { dish: 'Butter Chicken', origin: 'Delhi, India', story: 'Butter chicken was invented by accident in 1948 at Moti Mahal restaurant in Delhi. Kundan Lal Gujral had leftover tandoori chicken and threw it into a tomato-butter-cream sauce to keep it moist. It became the most ordered Indian dish in the world.', emoji: '🍗', year: '1948 CE' },
  { dish: 'Pizza', origin: 'Naples, Italy', story: 'Pizza was the food of the poor in Naples — cheap, filling, eaten on the street. The Margherita was created in 1889 for Queen Margherita of Savoy, with tomato (red), mozzarella (white), and basil (green) representing the Italian flag. The queen\'s approval made it respectable.', emoji: '🍕', year: '~1800 CE' },
  { dish: 'Sushi', origin: 'Southeast Asia → Japan', story: 'Sushi began as a preservation method — fish was packed in fermented rice for months. The rice was thrown away and only the fish was eaten. In 19th century Tokyo, Hanaya Yohei invented nigiri sushi — fresh fish on vinegared rice — as fast food for busy Edo merchants.', emoji: '🍣', year: '~800 CE' },
  { dish: 'Croissant', origin: 'Vienna → France', story: 'The croissant was invented in Vienna in 1683 to celebrate the defeat of the Ottoman army — its crescent shape mocks the Ottoman crescent. Marie Antoinette brought it to France. The French perfected the laminated dough technique, making it flakier and more buttery.', emoji: '🥐', year: '1683 CE' },
  { dish: 'Chocolate', origin: 'Mesoamerica → Europe', story: 'The Aztecs drank xocolatl — a bitter, spicy drink made from cacao beans — as a sacred ritual. When Hernán Cortés brought it to Spain in 1528, the Spanish added sugar and kept the recipe secret for 100 years. Solid chocolate wasn\'t invented until 1847.', emoji: '🍫', year: '~1500 BCE' },
  { dish: 'Curry', origin: 'India → Britain → World', story: 'The word "curry" was invented by the British — Indians don\'t use it. Each dish has its own name: dal, korma, vindaloo. The British took Indian spices home and created "curry powder" — a simplified blend. Today, chicken tikka masala is Britain\'s national dish.', emoji: '🍛', year: '~3000 BCE' },
  { dish: 'Baklava', origin: 'Ottoman Empire', story: 'Baklava was the imperial dessert of the Ottoman palace. Every year on the 15th of Ramadan, the Sultan would personally lead a procession to deliver baklava to the Janissary soldiers — a tradition called the Baklava Alayı. Today, Turkey, Greece, and Lebanon all claim it.', emoji: '🍯', year: '~1400 CE' },
  { dish: 'Dosa', origin: 'South India', story: 'The dosa is 2,000 years old, mentioned in Tamil Sangam literature. The fermentation of rice and lentils was discovered by accident — the batter left overnight became sour and bubbly. The crispy crepe that emerged became the foundation of South Indian breakfast culture.', emoji: '🫓', year: '~100 CE' },
  { dish: 'Pho', origin: 'Vietnam', story: 'Pho was born in northern Vietnam in the early 1900s, influenced by French pot-au-feu (hence "pho") and Chinese noodle soups. The French brought beef to Vietnam — before colonization, cattle were work animals, not food. The long-simmered bone broth is the soul of the dish.', emoji: '🍲', year: '~1900 CE' },
  { dish: 'Jollof Rice', origin: 'West Africa', story: 'Jollof rice originated with the Wolof people of Senegal. The "Jollof Wars" between Nigeria and Ghana are fought on social media every year — each country claims their version is superior. Nigerian jollof is smoky from the "party jollof" cooked over firewood at celebrations.', emoji: '🍚', year: '~1300 CE' },
  { dish: 'Injera', origin: 'Ethiopia/Eritrea', story: 'Injera is a sourdough flatbread made from teff — a grain that has been cultivated in Ethiopia for 5,000 years. It\'s both the plate and the utensil. The entire meal is served on top of the injera, and you tear pieces to scoop up the stews. Eating together from one injera symbolizes unity.', emoji: '🫓', year: '~3000 BCE' },
  { dish: 'Paella', origin: 'Valencia, Spain', story: 'Paella was the food of Valencian farmers and laborers, cooked over an open fire in the fields. The original paella had rabbit, snails, and green beans — no seafood. Seafood paella was invented later for tourists. The socarrat — the crispy rice at the bottom — is the most prized part.', emoji: '🥘', year: '~1800 CE' },
  { dish: 'Samosa', origin: 'Central Asia → India', story: 'The samosa traveled the Silk Road from Central Asia to India. It was originally called "sanbosag" in Persian — a triangular pastry filled with meat. Indian cooks adapted it with potatoes (introduced by the Portuguese) and spices. Today it\'s the most popular street food in South Asia.', emoji: '🥟', year: '~1000 CE' },
  { dish: 'Mole', origin: 'Oaxaca/Puebla, Mexico', story: 'Mole negro has over 30 ingredients including chocolate, dried chilies, and spices. Legend says it was created by nuns in Puebla who had nothing to serve the archbishop — they threw everything in the kitchen into a pot. It took three days to make. The archbishop declared it divine.', emoji: '🫙', year: '~1700 CE' },
  { dish: 'Falafel', origin: 'Egypt → Levant', story: 'Falafel was originally made with fava beans by Coptic Christians in Egypt as a meat substitute during Lent. When it spread to the Levant, chickpeas replaced fava beans. Today, Israel, Lebanon, and Egypt all claim falafel as their national dish — it belongs to all of them.', emoji: '🧆', year: '~1000 CE' },
  { dish: 'Peking Duck', origin: 'Beijing, China', story: 'Peking Duck has been served in Beijing since the Imperial era. The duck is inflated with air to separate the skin from the fat, then lacquered with maltose syrup and roasted in a wood-fired oven. The crispy skin is the delicacy — the meat is secondary. It takes 3 days to prepare.', emoji: '🦆', year: '~1400 CE' },
  { dish: 'Borscht', origin: 'Ukraine', story: 'Borscht is Ukraine\'s national dish — a beet soup that has been eaten for over 1,000 years. UNESCO recognized Ukrainian borscht as an intangible cultural heritage in 2022. Every family has their own recipe. The deep red color comes from beets, and it\'s always served with sour cream.', emoji: '🍲', year: '~1000 CE' },
  { dish: 'Pad Thai', origin: 'Thailand', story: 'Pad Thai was invented in the 1930s by the Thai government to create a national dish and reduce rice consumption during a shortage. The government distributed recipes and woks to street vendors. Within a decade, it became Thailand\'s most iconic dish — a government-created cultural identity.', emoji: '🍜', year: '1930s CE' },
];

const GRANDMA_STORIES = [
  {
    dish: 'Dal Makhani',
    narrator: 'Nani from Delhi',
    story: 'Beta, first you must soak the dal overnight — don\'t rush this, the dal needs to rest just like you do. In the morning, pressure cook it until it\'s so soft it melts on your tongue. Now, in a heavy-bottomed pan — not a thin one, it will burn — melt the butter slowly. Add the onions and let them turn golden, not brown, golden like the afternoon sun. The secret? A pinch of hing. Your nani always said hing is what makes dal taste like home. Add the tomatoes, let them cook until the oil separates — you\'ll see it floating on top, that\'s when you know it\'s ready. Then the dal goes in, and you let it simmer for one hour. One full hour. Don\'t rush. Good food cannot be rushed.',
  },
  {
    dish: 'Rasam',
    narrator: 'Paati from Chennai',
    story: 'Rasam is not just soup, kanna. It\'s medicine. When you have a cold, when you\'re sad, when you miss home — rasam fixes everything. First, the tamarind. Soak it in warm water, squeeze it with your hands — feel the pulp between your fingers. That\'s how you know it\'s ready. The tomatoes must be very ripe, almost overripe. The pepper — don\'t be shy with the pepper. Rasam should make you sneeze a little. That\'s how you know it\'s working. And the tadka at the end — mustard seeds, curry leaves, dried red chili in hot ghee. Pour it over the rasam and cover immediately. The sound it makes — that sizzle — that\'s the sound of love.',
  },
  {
    dish: 'Biryani',
    narrator: 'Dadi from Hyderabad',
    story: 'Biryani is not a recipe, jaan. It\'s a prayer. You must be in a good mood when you make biryani — the food absorbs your energy. Marinate the meat overnight — not one hour, overnight. The yogurt, the spices, the fried onions — they need time to become one. The rice must be 70% cooked before you layer it. Not 60%, not 80% — 70%. How do you know? You press a grain between your fingers. It should break but still have a white dot in the center. Then the dum — seal the pot with dough, cook on low flame for 25 minutes. Don\'t open it. Don\'t peek. Trust the process. When you open it, the steam that rises — that\'s the soul of the biryani.',
  },
];

export default function CulturePage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'stories' | 'grandma'>('calendar');
  const [selectedStory, setSelectedStory] = useState(0);
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

  return (
    <div className="max-w-screen-xl mx-auto">
      <section className="mb-10">
        <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Heritage First</span>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">Culture & Story</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl text-lg">Every dish has a story. Every meal is a ritual. Every recipe is a piece of living history.</p>
      </section>

      <div className="flex gap-2 mb-8 bg-surface-container rounded-xl p-1.5 w-fit overflow-x-auto no-scrollbar">
        {[{ id: 'calendar', label: '📅 Food Ritual Calendar' }, { id: 'stories', label: '📖 Dish Origin Stories' }, { id: 'grandma', label: '👵 Grandma Voice Mode' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-5 py-2.5 rounded-lg font-label font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-4 bg-tertiary-fixed rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-on-tertiary-fixed">calendar_today</span>
            <p className="text-sm text-on-tertiary-fixed font-medium">This month is <strong>{currentMonth}</strong> — see what people around the world are cooking right now.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FOOD_RITUALS.map((ritual, i) => (
              <div key={i} className={`${ritual.color} rounded-2xl p-6 border border-outline/10`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{ritual.month}</span>
                    <h3 className="font-headline font-bold text-on-surface text-lg mt-0.5">{ritual.festival}</h3>
                    <p className="text-xs text-on-surface-variant">{ritual.country}</p>
                  </div>
                  <span className="text-4xl">{ritual.emoji}</span>
                </div>
                <div className="bg-surface/60 backdrop-blur-sm rounded-xl p-3 mb-3">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Traditional Dish</p>
                  <p className="font-headline font-bold text-sm text-on-surface">{ritual.dish}</p>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{ritual.story}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="space-y-6">
          <p className="text-on-surface-variant">The history behind the world&apos;s most beloved dishes — where they came from, how they traveled, and why they matter.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ORIGIN_STORIES.map((story, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-5xl flex-shrink-0">{story.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-headline font-bold text-on-surface text-xl">{story.dish}</h3>
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-label font-bold">{story.year}</span>
                    </div>
                    <p className="text-primary font-label text-xs font-bold uppercase tracking-widest mb-3">{story.origin}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{story.story}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'grandma' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-tertiary-fixed to-surface-container rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">👵</div>
              <div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Grandma Voice Mode</h2>
                <p className="text-on-surface-variant">Recipes narrated like a story — the way a grandmother would teach you, not a clinical list of steps.</p>
              </div>
            </div>

            {/* Story selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
              {GRANDMA_STORIES.map((s, i) => (
                <button key={i} onClick={() => setSelectedStory(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full font-label font-bold text-sm transition-all ${selectedStory === i ? 'bg-primary text-on-primary' : 'bg-surface/60 text-on-surface hover:bg-surface'}`}>
                  {s.dish}
                </button>
              ))}
            </div>

            <div className="bg-surface/60 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{GRANDMA_STORIES[selectedStory].narrator}</p>
              <p className="text-on-surface leading-relaxed italic text-base">&ldquo;{GRANDMA_STORIES[selectedStory].story}&rdquo;</p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Story Mode', desc: 'Recipes told as family stories with cultural context', icon: 'history_edu' },
              { title: 'Regional Dialects', desc: 'Available in Punjabi, Tamil, Bengali, and more', icon: 'language' },
              { title: 'Slow Narration', desc: 'Paced for cooking — pauses at each step', icon: 'slow_motion_video' },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/10">
                <span className="material-symbols-outlined text-primary text-2xl mb-3 block">{icon}</span>
                <h3 className="font-headline font-bold text-on-surface mb-1">{title}</h3>
                <p className="text-sm text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/discovery" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all">
              <span className="material-symbols-outlined text-sm">restaurant_menu</span>
              Browse Recipes with Grandma Mode
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
