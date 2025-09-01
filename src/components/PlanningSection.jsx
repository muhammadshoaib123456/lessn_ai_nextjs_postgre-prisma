const PlanningSection = () => {
  return (
    <section className="bg-gradient-to-b from-[#500078] to-[#9500DE] py-16 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className=" sm: w:1 md:w-1/2 lg:w-1/3 ">
          <h2 className="mb-4 text-3xl ">
            Spend more time with your students, less on your planning
          </h2>
          <p className="mb-6 max-w-md text-gray-200">
            Generate standards-based, AI-driven lessons that provide a solid
            foundation for your lectures.
          </p>
          <p className="max-w-md text-gray-200">
            Leverage the lesson library with more than 10K expert-crafted
            lessons.
          </p>
        </div>
        <div className="md:w-1/2">
          <img
            src="/Image-1.svg"
            alt="Planning illustration"
            className="mx-auto w-full max-w-[320px] object-contain sm:max-w-[400px] md:max-w-[480px] lg:max-w-[600px] xl:max-w-[720px] 2xl:max-w-[840px]"
          />
        </div>
      </div>
    </section>
  );
};

export default PlanningSection;
