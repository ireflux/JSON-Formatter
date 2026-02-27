import { ref } from 'vue'

export function useInlineToast(defaultDuration = 3000) {
  const toast = ref({
    show: false,
    message: '',
    type: 'success'
  })

  let timerId = null

  const showToast = (message, type = 'success', duration = defaultDuration) => {
    if (timerId) {
      clearTimeout(timerId)
    }

    toast.value = {
      show: true,
      message,
      type
    }

    timerId = setTimeout(() => {
      toast.value.show = false
      timerId = null
    }, duration)
  }

  const clearToast = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
    toast.value.show = false
  }

  return {
    toast,
    showToast,
    clearToast
  }
}
