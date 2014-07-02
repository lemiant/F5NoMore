from distutils.core import setup

setup(
    name='F5NoMore',
    version='0.1.0',
    author='Alex Rodrigues',
    author_email='example@example.com',
    packages=['f5nomore'],
    license='LICENSE.txt',
    description='Autoreload webpage on file system changes',
    long_description=open('README.txt').read(),
    install_requires=[
        "watchdog >= 0.7.0 < 0.8.0"
    ]
)