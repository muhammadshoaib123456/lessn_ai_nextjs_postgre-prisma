const WeaponSection = () => {
  return (
    <section className="bg-white py-16 item">
      <div className="container mx-auto px-6 text-center">
        <h2 className="mb-20 text-4xl font-semibold text-gray-800 ">
          Your secret weapon for impactful, instant lessons
        </h2>
        <div className="flex flex-col items-center justify-center">
          <img
            src="/Image.svg"
            alt="Secret weapon illustration"
            className="mx-auto w-full max-w-[300px] object-contain sm:max-w-[470px] md:max-w-[480px] lg:max-w-[870px] xl:max-w-[720px] 2xl:max-w-[840px]"
          />
          
        </div>
      </div>
    </section>
  );
};

export default WeaponSection;
