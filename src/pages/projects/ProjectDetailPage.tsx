import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Stub — replaced by the project detail plan (02-06). */
export default function ProjectDetailPage() {
  const { id } = useParams()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project {id}</CardTitle>
      </CardHeader>
      <CardContent>Project detail coming in plan 02-06.</CardContent>
    </Card>
  )
}
