export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  return (
    <div className="p-6">
      <h1 className="font-headline text-2xl font-bold">Course {params.courseId}</h1>
    </div>
  );
}
