// المدن وطريقة الحساب والمنطقة الزمنية — الإحداثيات لعواصم المحافظات
const EG = (id, name, lat, lng) => ({ id: 'eg-' + id, country: 'مصر', name, lat, lng, method: 'Egyptian', tz: 'Africa/Cairo' });
export const CITIES = [
  EG('cairo', 'القاهرة', 30.0444, 31.2357), EG('giza', 'الجيزة', 30.0131, 31.2089), EG('alex', 'الإسكندرية', 31.2001, 29.9187),
  EG('qalyubia', 'القليوبية (بنها)', 30.466, 31.1848), EG('sharqia', 'الشرقية (الزقازيق)', 30.5877, 31.502), EG('dakahlia', 'الدقهلية (المنصورة)', 31.0409, 31.3785),
  EG('gharbia', 'الغربية (طنطا)', 30.7865, 31.0004), EG('menofia', 'المنوفية (شبين الكوم)', 30.555, 31.0094), EG('kafrelsheikh', 'كفر الشيخ', 31.1107, 30.9388),
  EG('beheira', 'البحيرة (دمنهور)', 31.0341, 30.4682), EG('damietta', 'دمياط', 31.4165, 31.8133), EG('portsaid', 'بورسعيد', 31.2653, 32.3019),
  EG('ismailia', 'الإسماعيلية', 30.5965, 32.2715), EG('suez', 'السويس', 29.9668, 32.5498), EG('fayoum', 'الفيوم', 29.3084, 30.8428),
  EG('benisuef', 'بني سويف', 29.0661, 31.0994), EG('minya', 'المنيا', 28.1099, 30.7503), EG('assiut', 'أسيوط', 27.181, 31.1837),
  EG('sohag', 'سوهاج', 26.5591, 31.6957), EG('qena', 'قنا', 26.1551, 32.716), EG('luxor', 'الأقصر', 25.6872, 32.6396),
  EG('aswan', 'أسوان', 24.0889, 32.8998), EG('redsea', 'البحر الأحمر (الغردقة)', 27.2579, 33.8116), EG('newvalley', 'الوادي الجديد (الخارجة)', 25.439, 30.5586),
  EG('matrouh', 'مطروح', 31.3543, 27.2373), EG('northsinai', 'شمال سيناء (العريش)', 31.1316, 33.7984), EG('southsinai', 'جنوب سيناء (الطور)', 28.2416, 33.6222),
  { id: 'sa-makkah', country: 'السعودية', name: 'مكة المكرمة', lat: 21.4225, lng: 39.8262, method: 'UmmAlQura', tz: 'Asia/Riyadh' },
  { id: 'sa-madinah', country: 'السعودية', name: 'المدينة المنورة', lat: 24.4672, lng: 39.6024, method: 'UmmAlQura', tz: 'Asia/Riyadh' },
  { id: 'sa-riyadh', country: 'السعودية', name: 'الرياض', lat: 24.7136, lng: 46.6753, method: 'UmmAlQura', tz: 'Asia/Riyadh' },
  { id: 'sa-jeddah', country: 'السعودية', name: 'جدة', lat: 21.4858, lng: 39.1925, method: 'UmmAlQura', tz: 'Asia/Riyadh' },
  { id: 'ae-dubai', country: 'الإمارات', name: 'دبي', lat: 25.2048, lng: 55.2708, method: 'Dubai', tz: 'Asia/Dubai' },
  { id: 'ae-abudhabi', country: 'الإمارات', name: 'أبوظبي', lat: 24.4539, lng: 54.3773, method: 'Dubai', tz: 'Asia/Dubai' },
  { id: 'kw-kuwait', country: 'الكويت', name: 'الكويت', lat: 29.3759, lng: 47.9774, method: 'Kuwait', tz: 'Asia/Kuwait' },
  { id: 'qa-doha', country: 'قطر', name: 'الدوحة', lat: 25.2854, lng: 51.531, method: 'Qatar', tz: 'Asia/Qatar' },
  { id: 'jo-amman', country: 'الأردن', name: 'عمّان', lat: 31.9539, lng: 35.9106, method: 'MuslimWorldLeague', tz: 'Asia/Amman' },
  { id: 'ps-quds', country: 'فلسطين', name: 'القدس', lat: 31.7683, lng: 35.2137, method: 'MuslimWorldLeague', tz: 'Asia/Hebron' },
  { id: 'ly-tripoli', country: 'ليبيا', name: 'طرابلس', lat: 32.8872, lng: 13.1913, method: 'MuslimWorldLeague', tz: 'Africa/Tripoli' },
  { id: 'sd-khartoum', country: 'السودان', name: 'الخرطوم', lat: 15.5007, lng: 32.5599, method: 'Egyptian', tz: 'Africa/Khartoum' },
];
export const METHODS = {
  Egyptian: 'الهيئة المصرية العامة للمساحة', UmmAlQura: 'أم القرى', Dubai: 'دبي', Kuwait: 'الكويت', Qatar: 'قطر',
  MuslimWorldLeague: 'رابطة العالم الإسلامي', Karachi: 'جامعة العلوم الإسلامية بكراتشي', Turkey: 'رئاسة الشؤون الدينية التركية',
};
