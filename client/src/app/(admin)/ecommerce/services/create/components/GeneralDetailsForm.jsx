import { yupResolver } from '@hookform/resolvers/yup'
import { Col, Row, Button } from 'react-bootstrap'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import ReactQuill from 'react-quill'
import * as yup from 'yup'
import TextFormInput from '@/components/form/TextFormInput'
import 'react-quill/dist/quill.snow.css'
import { useGlobalContext } from '@/context/useGlobalContext'

const generalFormSchema = yup.object({
  name: yup.string().required('Service name is required'),
  descQuill: yup.string().required('Service description is required'),
  icon: yup
    .mixed()
    .required('SVG icon is required')
    .test('fileType', 'Only .svg files are allowed', (value) => {
      return value && value[0] && value[0].type === 'image/svg+xml'
    }),
})

const normalizeQuillValue = (value) => {
  if (!value || value === '<p><br></p>' || value === '<br/>') return ''
  return value
}

const GeneralDetailsForm = () => {
  const { createService } = useGlobalContext()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(generalFormSchema),
    defaultValues: {
      name: '',
      descQuill: '',
      icon: null,
    },
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.descQuill)
      formData.append('icon', data.icon[0]) // SVG

      await createService(formData)

      alert('Service created successfully!')

      reset({
        name: '',
        descQuill: '',
        icon: null,
      })
      setPreview(null)
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to create service')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Handle SVG preview
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col lg={6}>
          <TextFormInput
            control={control}
            label="Service Name"
            placeholder="Enter service name"
            containerClassName="mb-3"
            id="service-name"
            name="name"
            error={errors.name?.message}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={12}>
          <div className="mb-5">
            <label className="form-label">Service Description</label>
            <Controller
              name="descQuill"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={normalizeQuillValue(field.value)}
                  onChange={(content) => field.onChange(normalizeQuillValue(content))}
                  style={{ height: 195 }}
                  className="pb-sm-3 pb-5 pb-xl-0"
                  modules={{
                    toolbar: [
                      [{ font: [] }, { size: [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ script: 'super' }, { script: 'sub' }],
                      [{ header: [false, 1, 2, 3, 4, 5, 6] }, 'blockquote', 'code-block'],
                      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                      [{ direction: 'rtl' }, { align: [] }],
                      ['link', 'image', 'video'],
                      ['clean'],
                    ],
                  }}
                />
              )}
            />
            {errors.descQuill && <p className="text-danger mt-1">{errors.descQuill.message}</p>}
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <div className="mb-4 mt-4">
            <label className="form-label">Service Icon (SVG only)</label>
            <input
              type="file"
              accept=".svg"
              {...register('icon')}
              className="form-control"
              onChange={(e) => {
                handleFileChange(e)
                // manually update form state for react-hook-form
                register('icon').onChange(e)
              }}
            />
            {errors.icon && <p className="text-danger mt-1">{errors.icon.message}</p>}

            {preview && (
              <div className="mt-3">
                <p className="mb-1 fw-bold">Preview:</p>
                <img src={preview} alt="SVG preview" width="100" height="100" />
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Button type="submit" disabled={loading} className="mt-4">
        {loading ? 'Creating...' : 'Create Service'}
      </Button>
    </form>
  )
}
export default GeneralDetailsForm
