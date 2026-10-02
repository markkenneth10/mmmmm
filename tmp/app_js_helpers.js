function getDefaultInfoCardImage(idx) {
  const defaults = [
    '/assets/climate_change_thumb_1789457800658.jpg',
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    '/assets/climate_hero_banner.jpg',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80'
  ];
  return defaults[idx] || defaults[0];
}
